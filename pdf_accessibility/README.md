# מערכת הנגשת PDF (מקומית)

כלי מקומי (Python + FastAPI) שמעלה קובץ PDF ומחזיר גרסה "מונגשת" (best-effort)
יחד עם דוח נגישות. הכלי רץ כולו על המחשב שלכם - שום קובץ לא נשלח לשרת חיצוני,
מלבד תמונות בודדות שנשלחות ל-Claude API לצורך יצירת alt-text (אם הוגדר מפתח).

## מה הכלי עושה

1. **זיהוי PDF סרוק מול טקסטואלי**, והרצת OCR (Tesseract) על עמודים סרוקים
   כדי להוסיף שכבת טקסט חבויה (searchable/selectable), מבלי לשנות את המראה
   החזותי של הסריקה.
2. **ניתוח מבנה** לפי גודל/משקל פונט ומיקום: כותרות (H1-H6), פסקאות, רשימות,
   טבלאות (זיהוי גבולות טבלה אוטומטי), וסדר קריאה לוגי (כולל טיפול בסיסי
   בפריסת טורים).
3. **תיאורי alt-text לתמונות** באמצעות Claude API (vision) - בעברית או
   באנגלית, לפי שפת המסמך.
4. **בניית Tagged PDF** (structure tree עם MCID, StructTreeRoot, ParentTree)
   באמצעות pikepdf/qpdf-level manipulation, כולל metadata (כותרת, שפה,
   MarkInfo).
5. **דוח נגישות** (HTML + PDF): מה בוצע אוטומטית, מה דורש בדיקה ידנית, והצהרה
   מפורשת שהפלט **אינו** מובטח לעמוד בתקן PDF/UA באופן מלא.

## מגבלות ידועות (חשוב לקרוא!)

- זהו כלי best-effort, לא מנוע PDF/UA מלא. **יש לאמת את הפלט בכלי ייעודי כמו
  [PAC (PDF Accessibility Checker)](https://pac.pdf-accessibility.org/) לפני
  שימוש רשמי, משפטי או פרסום ציבורי.**
- שיוך טקסט למבנה (MCID) מתבצע בהיוריסטיקה של ספירת תווים לפי סדר הופעה
  ב-content stream - עובד טוב על מסמכים "רגילים" (דוחות, מכתבים, מסמכי
  Word/LibreOffice), ועלול להחליק על מסמכים עם פריסה חריגה.
- **תאי טבלה** מקבלים מבנה לוגי (`Table`/`TR`/`TH`/`TD`) עם `ActualText`, אך
  ללא קישור MCID מדויק לתוכן העמוד - טבלאות מורכבות דורשות בדיקה ידנית.
- קישורים ללא טקסט תיאורי וניגודיות צבעים **לא** נבדקים אוטומטית.
- איכות ה-OCR תלויה באיכות הסריקה ובחבילת השפה של Tesseract שהותקנה.

## דרישות מקדימות

- Python 3.10 ומעלה.
- **Tesseract OCR** מותקן במערכת (חובה עבור מסמכים סרוקים):

  ```bash
  # Ubuntu / Debian
  sudo apt-get install tesseract-ocr tesseract-ocr-heb

  # macOS (Homebrew)
  brew install tesseract tesseract-lang

  # Windows: התקינו מ- https://github.com/UB-Mannheim/tesseract/wiki
  ```

- **גופן Unicode** (למשל DejaVu Sans) מותקן במערכת - נדרש כדי ששכבת ה-OCR
  הנסתרת לעברית תהיה ניתנת לחילוץ נכון על ידי קוראי מסך/חיפוש. ברוב הפצות
  לינוקס הוא כבר מותקן; אחרת:

  ```bash
  sudo apt-get install fonts-dejavu-core
  ```

  אם לא נמצא גופן כזה, הכלי ימשיך לעבוד, אך יוסיף אזהרה בדוח הנגישות לגבי
  איכות שכבת ה-OCR הלועזית/עברית.

- **מפתח API של Anthropic** (Claude) - כדי לקבל תיאורי alt-text אמיתיים
  לתמונות (ולא טקסט גנרי). ניתן ליצור מפתח בכתובת
  https://console.anthropic.com/

## התקנה

```bash
cd pdf_accessibility
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

צרו קובץ `.env` על בסיס `.env.example` והזינו את מפתח ה-API שלכם:

```bash
cp .env.example .env
```

ואז ערכו את `.env`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

(המפתח הזה שלכם בלבד - הוא נשמר מקומית ולא משותף עם אף אחד. בלי מפתח, המערכת
עדיין תעבוד, אבל תמונות יקבלו alt-text גנרי בלבד.)

## הרצה

```bash
uvicorn app.main:app --reload --port 8000
```

פתחו דפדפן בכתובת http://localhost:8000 , העלו קובץ PDF, לחצו "הנגש", והורידו
את הקובץ המונגש + הדוחות.

## פריסה בענן (Render) - אופציונלי

אם אתם רוצים כתובת אינטרנט קבועה במקום להריץ מקומית, אפשר לפרוס בחינם ב-
[Render](https://render.com/):

1. היכנסו ל-https://dashboard.render.com/blueprints ובחרו "New Blueprint
   Instance", חברו את חשבון ה-GitHub שלכם ובחרו את הריפו הזה
   (הקובץ `render.yaml` שבשורש הריפו מגדיר הכל אוטומטית).
2. Render יבקש למלא את `ANTHROPIC_API_KEY` - הדביקו את המפתח שלכם.
3. לחצו "Apply" וחכו לבנייה (כמה דקות). תקבלו כתובת ציבורית קבועה.

**אזהרת אבטחה**: כתובת כזו נגישה לכל מי שיש לו אותה, וכל שימוש בה צורך את
מפתח ה-API **שלכם**. אם אין הגנת סיסמה, כל מי שמקבל את הקישור יכול להעלות
קבצים ולהשתמש במכסה שלכם ב-Anthropic. שקלו להוסיף הגנת סיסמה (Basic Auth)
לפני שיתוף הקישור עם אחרים.

## מבנה הפרויקט

```
pdf_accessibility/
  app/
    main.py              # FastAPI: upload, processing, downloads
    config.py            # env vars, limits
    static/              # index.html + app.js + style.css (ללא frameworks)
    pipeline/
      detect.py          # אימות קובץ + זיהוי PDF סרוק/טקסטואלי
      ocr.py              # OCR (pytesseract) + שכבת טקסט חבויה
      structure.py        # כותרות/פסקאות/רשימות/טבלאות/סדר קריאה
      images.py            # חילוץ תמונות
      alt_text.py          # קריאה ל-Claude API ליצירת alt-text
      tagging.py           # בניית StructTreeRoot / MCID עם pikepdf
      metadata.py          # כותרת/שפה/MarkInfo
      report.py            # דוח HTML + PDF
      runner.py            # מריץ את כל השלבים ברצף
  storage/                # קבצים זמניים (uploads/outputs) - ב-gitignore
  requirements.txt
  .env.example
```

## פתרון בעיות

- **"הקובץ מוצפן / מוגן בסיסמה"** - הסירו את ההצפנה לפני העלאה, למשל:
  `qpdf --decrypt input.pdf output.pdf`
- **"לא ניתן לקרוא את הקובץ"** - הקובץ פגום או שאינו PDF תקין.
- **OCR לא עובד / שגיאת tesseract not found** - ודאו ש-Tesseract מותקן ונמצא
  ב-PATH (`tesseract --version`).
- **טקסט עברי לא נשמר נכון בשכבת ה-OCR** - התקינו גופן Unicode (ראו למעלה).
