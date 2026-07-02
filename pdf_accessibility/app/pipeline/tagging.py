"""Best-effort Tagged-PDF structure builder.

Strategy
--------
For every page we re-tokenize the (coalesced) content stream with
`pikepdf.parse_content_stream`, and:

1. Wrap each text-showing run (a `BT ... ET` text object) in `BDC/EMC` marked
   content, assigning it a fresh MCID. Runs are matched to the text blocks
   found by `structure.py` (headings/paragraphs/list items) by walking both
   lists in document order and greedily consuming characters - the same
   heuristic real low-level tagging tools use when no cross-reference to the
   original layout engine survives. It is not pixel/character exact.
2. Wrap each image-painting `Do` operator that corresponds to a detected
   figure in its own `BDC/EMC`, with a fresh MCID.
3. Build a `StructTreeRoot` whose top-level `Document` element lists
   H1-H6 / P / L>LI / Table>TR>TH,TD / Figure elements in the logical
   reading order computed by `structure.py`, and a matching `ParentTree`
   (number tree) so MCID -> StructElem lookups resolve both ways.

Known, disclosed limitations (see report.py):
 - Table cell content is *not* linked back to content-stream MCIDs (no
   reliable per-cell text-run matching was attempted); cells carry
   `/ActualText` only. Complex tables need manual verification.
 - Heading/paragraph -> content matching is a character-count heuristic and
   can drift on unusual content streams (e.g. heavy kerning, rotated text,
   forms); such pages are flagged as needing manual review.
"""
from __future__ import annotations

import logging

import pikepdf
from pikepdf import Array, ContentStreamInstruction, Dictionary, Name, Operator, String

from .models import BlockKind, DocumentModel, FigureInfo, TableInfo, TextBlock

logger = logging.getLogger(__name__)

_TEXT_SHOW_OPS = {"Tj", "'", '"', "TJ"}


def _decode_operand_len(operand) -> int:
    if isinstance(operand, pikepdf.String):
        try:
            return len(bytes(operand))
        except Exception:  # noqa: BLE001
            return 0
    return 0


def _run_char_count(instrs: list, cid_font: bool) -> int:
    total = 0
    for ins in instrs:
        op = str(ins.operator)
        if op in ("Tj", "'"):
            if ins.operands:
                total += _decode_operand_len(ins.operands[-1])
        elif op == '"':
            if ins.operands:
                total += _decode_operand_len(ins.operands[-1])
        elif op == "TJ":
            if ins.operands and isinstance(ins.operands[0], (Array, list)):
                for el in ins.operands[0]:
                    total += _decode_operand_len(el)
    return (total // 2) if cid_font and total else total


def _font_cid_map(pike_page) -> dict:
    """Map font resource name (e.g. '/F1') -> True if it is a composite
    (Type0/CID-keyed) font, where each glyph is usually encoded as 2 bytes.
    """
    result = {}
    try:
        fonts = pike_page.obj["/Resources"]["/Font"]
    except KeyError:
        return result
    for name, font_obj in fonts.items():
        try:
            result[str(name)] = str(font_obj.get("/Subtype")) == "/Type0"
        except Exception:  # noqa: BLE001
            result[str(name)] = False
    return result


def _xobject_xref_map(pike_page) -> dict:
    """Map XObject resource name -> object id (xref number)."""
    result = {}
    try:
        xobjects = pike_page.obj["/Resources"]["/XObject"]
    except KeyError:
        return result
    for name, obj in xobjects.items():
        try:
            result[str(name)] = obj.objgen[0]
        except Exception:  # noqa: BLE001
            continue
    return result


_HEADING_TAG = "H{level}"


def _struct_type_for_block(block: TextBlock) -> str:
    if block.kind == BlockKind.HEADING:
        level = max(1, min(6, block.heading_level or 1))
        return _HEADING_TAG.format(level=level)
    if block.kind == BlockKind.LIST_ITEM:
        return "Span"
    return "P"


class _PageTaggingResult:
    def __init__(self):
        self.block_mcids: dict[int, list[int]] = {}  # id(block) -> [mcid,...]
        self.figure_mcids: dict[int, int] = {}  # id(figure) -> mcid
        self.mcid_owner: list = []  # index = mcid -> owning block/figure object (or None)
        self.warning: str | None = None


def _tag_page_content(
    pdf: pikepdf.Pdf,
    page_index: int,
    blocks: list[TextBlock],
    figures: list[FigureInfo],
) -> _PageTaggingResult:
    result = _PageTaggingResult()
    pike_page = pdf.pages[page_index]
    pike_page.contents_coalesce()
    instructions = pikepdf.parse_content_stream(pike_page)

    cid_map = _font_cid_map(pike_page)
    xobj_map = _xobject_xref_map(pike_page)
    figures_by_xref = {f.xref: f for f in figures}

    ordered_blocks = sorted(
        [b for b in blocks if b.text.strip()], key=lambda b: b.physical_order
    )
    block_ptr = 0
    block_remaining = len(ordered_blocks[0].text.strip()) if ordered_blocks else 0
    current_font = None

    new_instructions: list = []
    mcid_counter = 0
    unmatched_runs = 0

    i = 0
    n = len(instructions)
    while i < n:
        ins = instructions[i]
        op = str(ins.operator)

        if op == "Tf" and ins.operands:
            current_font = str(ins.operands[0])

        if op == "BT":
            j = i
            depth_ok = True
            while j < n and str(instructions[j].operator) != "ET":
                j += 1
            if j >= n:
                # Malformed / unbalanced content stream - bail out untouched.
                new_instructions.extend(instructions[i:])
                result.warning = "מבנה content stream לא תקין - העמוד לא תויג."
                break

            interior = instructions[i + 1 : j]
            is_cid = cid_map.get(current_font, False)
            run_len = _run_char_count(interior, is_cid)

            if run_len == 0 or not ordered_blocks or block_ptr >= len(ordered_blocks):
                if run_len > 0 and ordered_blocks:
                    unmatched_runs += 1
                new_instructions.append(instructions[i])  # BT
                new_instructions.extend(interior)
                new_instructions.append(instructions[j])  # ET
            else:
                block = ordered_blocks[block_ptr]
                tag = _struct_type_for_block(block)

                mcid = mcid_counter
                mcid_counter += 1
                result.block_mcids.setdefault(id(block), []).append(mcid)
                result.mcid_owner.append(("block", id(block)))

                new_instructions.append(instructions[i])  # BT
                new_instructions.append(
                    ContentStreamInstruction(
                        [Name("/" + tag), Dictionary({"/MCID": mcid})], Operator("BDC")
                    )
                )
                new_instructions.extend(interior)
                new_instructions.append(ContentStreamInstruction([], Operator("EMC")))
                new_instructions.append(instructions[j])  # ET

                block_remaining -= run_len
                if block_remaining <= 0:
                    block_ptr += 1
                    if block_ptr < len(ordered_blocks):
                        block_remaining = len(ordered_blocks[block_ptr].text.strip())

            i = j + 1
            continue

        if op == "Do" and ins.operands:
            xobj_name = str(ins.operands[0])
            xref = xobj_map.get(xobj_name)
            figure = figures_by_xref.get(xref) if xref is not None else None
            if figure is not None and id(figure) not in result.figure_mcids:
                mcid = mcid_counter
                mcid_counter += 1
                result.figure_mcids[id(figure)] = mcid
                result.mcid_owner.append(("figure", id(figure)))
                new_instructions.append(
                    ContentStreamInstruction(
                        [Name("/Figure"), Dictionary({"/MCID": mcid})], Operator("BDC")
                    )
                )
                new_instructions.append(ins)
                new_instructions.append(ContentStreamInstruction([], Operator("EMC")))
                i += 1
                continue

        new_instructions.append(ins)
        i += 1

    if unmatched_runs:
        result.warning = (
            f"{unmatched_runs} קטעי טקסט בעמוד {page_index + 1} (כנראה בתוך טבלה) "
            "לא שויכו לתג מבנה ספציפי - מומלץ לבדוק ידנית."
        )

    new_data = pikepdf.unparse_content_stream(new_instructions)
    pike_page.Contents = pikepdf.Stream(pdf, new_data)
    pike_page.obj["/StructParents"] = page_index
    result.mcid_total = mcid_counter  # type: ignore[attr-defined]
    return result


def _make_struct_elem(pdf: pikepdf.Pdf, struct_type: str, page_obj, k=None, alt=None, actual_text=None):
    d: dict = {"/Type": Name("/StructElem"), "/S": Name("/" + struct_type), "/Pg": page_obj}
    if k is not None:
        d["/K"] = k
    if alt is not None:
        d["/Alt"] = String(alt)
    if actual_text is not None:
        d["/ActualText"] = String(actual_text)
    return pdf.make_indirect(Dictionary(d))


def build_tagged_structure(pdf: pikepdf.Pdf, doc_model: DocumentModel) -> list[str]:
    """Mutates `pdf` in place: rewrites content streams with MCIDs and builds
    the StructTreeRoot. Returns a list of human-readable warnings.
    """
    warnings: list[str] = []
    blocks_by_page: dict[int, list[TextBlock]] = {}
    for b in doc_model.blocks:
        blocks_by_page.setdefault(b.page, []).append(b)
    figures_by_page: dict[int, list[FigureInfo]] = {}
    for f in doc_model.figures:
        figures_by_page.setdefault(f.page, []).append(f)
    tables_by_page: dict[int, list[TableInfo]] = {}
    for t in doc_model.tables:
        tables_by_page.setdefault(t.page, []).append(t)

    # Per-page tagging + ParentTree bookkeeping.
    parent_tree_nums: list = []
    top_level_elems_by_page: dict[int, list[tuple[int, object]]] = {}
    block_id_to_elem: dict[int, object] = {}
    figure_id_to_elem: dict[int, object] = {}

    for page_index in range(doc_model.n_pages):
        page_blocks = blocks_by_page.get(page_index, [])
        page_figures = figures_by_page.get(page_index, [])
        page_tables = tables_by_page.get(page_index, [])
        pike_page = pdf.pages[page_index]

        try:
            tag_result = _tag_page_content(pdf, page_index, page_blocks, page_figures)
        except Exception as exc:  # noqa: BLE001 - never let one page crash the run
            logger.exception("Tagging failed on page %s", page_index)
            warnings.append(
                f"תיוג העמוד {page_index + 1} נכשל ({exc}); העמוד נשמר ללא תגי מבנה."
            )
            continue

        if tag_result.warning:
            warnings.append(tag_result.warning)

        parent_array = [None] * getattr(tag_result, "mcid_total", 0)
        page_top_items: list[tuple[int, object]] = []

        # Headings / paragraphs, with consecutive list items grouped into <L>.
        ordered = sorted(page_blocks, key=lambda b: b.reading_order)
        idx = 0
        while idx < len(ordered):
            block = ordered[idx]
            mcids = tag_result.block_mcids.get(id(block), [])
            if not mcids:
                idx += 1
                continue

            if block.kind == BlockKind.LIST_ITEM:
                item_elems = []
                while idx < len(ordered) and ordered[idx].kind == BlockKind.LIST_ITEM:
                    b2 = ordered[idx]
                    m2 = tag_result.block_mcids.get(id(b2), [])
                    if m2:
                        lbody = _make_struct_elem(
                            pdf, "LBody", pike_page.obj, k=(m2[0] if len(m2) == 1 else Array(m2))
                        )
                        for m in m2:
                            parent_array[m] = lbody
                        li = _make_struct_elem(pdf, "LI", pike_page.obj, k=[lbody])
                        lbody["/P"] = li
                        item_elems.append(li)
                        block_id_to_elem[id(b2)] = li
                    idx += 1
                list_elem = _make_struct_elem(pdf, "L", pike_page.obj, k=item_elems)
                for li in item_elems:
                    li["/P"] = list_elem
                page_top_items.append((block.reading_order, list_elem))
                continue

            struct_type = _struct_type_for_block(block)
            k_val = mcids[0] if len(mcids) == 1 else Array(mcids)
            elem = _make_struct_elem(pdf, struct_type, pike_page.obj, k=k_val)
            for m in mcids:
                parent_array[m] = elem
            block_id_to_elem[id(block)] = elem
            page_top_items.append((block.reading_order, elem))
            idx += 1

        # Figures.
        for fig in page_figures:
            mcid = tag_result.figure_mcids.get(id(fig))
            if mcid is None:
                warnings.append(
                    f"לא נמצא קישור בין תמונה (עמוד {page_index + 1}) לתוכן ה-PDF; "
                    "התמונה לא תויגה כ-Figure."
                )
                continue
            fig_elem = _make_struct_elem(
                pdf, "Figure", pike_page.obj, k=mcid, alt=fig.alt_text
            )
            parent_array[mcid] = fig_elem
            figure_id_to_elem[id(fig)] = fig_elem
            page_top_items.append((fig.reading_order, fig_elem))

        # Tables: structural only, no MCID linkage (see module docstring).
        for table in page_tables:
            n_rows = table.n_rows
            n_cols = table.n_cols
            grid = [[None] * n_cols for _ in range(n_rows)]
            for cell in table.cells:
                if cell.row < n_rows and cell.col < n_cols:
                    grid[cell.row][cell.col] = cell
            tr_elems = []
            for r in range(n_rows):
                cell_elems = []
                for c in range(n_cols):
                    cell = grid[r][c]
                    text = cell.text if cell else ""
                    cell_type = "TH" if (cell and cell.is_header) else "TD"
                    cell_elem = _make_struct_elem(
                        pdf, cell_type, pike_page.obj, actual_text=text
                    )
                    cell_elems.append(cell_elem)
                tr_elem = _make_struct_elem(pdf, "TR", pike_page.obj, k=cell_elems)
                for ce in cell_elems:
                    ce["/P"] = tr_elem
                tr_elems.append(tr_elem)
            table_elem = _make_struct_elem(pdf, "Table", pike_page.obj, k=tr_elems)
            for tr in tr_elems:
                tr["/P"] = table_elem
            page_top_items.append((table.reading_order, table_elem))

        top_level_elems_by_page[page_index] = sorted(page_top_items, key=lambda x: x[0])
        if any(parent_array):
            parent_tree_nums.append((page_index, Array(parent_array)))

    # Assemble the document-level structure tree in (page, reading_order) order.
    all_top_elems = []
    for page_index in range(doc_model.n_pages):
        all_top_elems.extend(elem for _, elem in top_level_elems_by_page.get(page_index, []))

    document_elem = pdf.make_indirect(
        Dictionary({"/Type": Name("/StructElem"), "/S": Name("/Document"), "/K": all_top_elems})
    )
    for elem in all_top_elems:
        elem["/P"] = document_elem

    nums_array = []
    for page_index, arr in parent_tree_nums:
        nums_array.append(page_index)
        nums_array.append(arr)

    struct_tree_root = pdf.make_indirect(
        Dictionary(
            {
                "/Type": Name("/StructTreeRoot"),
                "/K": [document_elem],
                "/ParentTree": Dictionary({"/Nums": Array(nums_array)}),
                "/ParentTreeNextKey": doc_model.n_pages,
            }
        )
    )
    document_elem["/P"] = struct_tree_root
    pdf.Root["/StructTreeRoot"] = struct_tree_root

    return warnings
