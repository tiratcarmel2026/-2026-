# Worker תמלול הקלטות (עברית + זיהוי דוברים)

תהליך (worker) בפייתון שרץ על שרת/מחשב משלכם - **לא** על Vercel - ומבצע את
העבודה הכבדה: תמלול דיבור לעברית וזיהוי מי דיבר מתי. הוא "מאזין" לתור עבודות
בטבלת `transcription_jobs` ב-Supabase (אותו פרויקט Supabase של אתר קביעת
התורים) וכותב את התוצאה בחזרה לשם. מסך ההעלאה/הצפייה נמצא באתר עצמו, בכתובת
`/admin/transcription`.

## למה תהליך נפרד ולא חלק מאתר ה-Next.js?

תמלול (Whisper) וזיהוי דוברים (pyannote) על הקלטה של 3-4 שעות יכולים לקחת
זמן רב (במיוחד על מעבד רגיל בלי GPU) - הרבה מעבר למגבלת הזמן של פונקציית
Vercel. לכן ה-worker רץ כתהליך ארוך-חיים על מחשב/שרת שלכם (עדיף עם GPU של
NVIDIA), בזמן שהאתר עצמו יכול להמשיך לרוץ ב-Vercel כרגיל.

## איך זה עובד

1. באתר, מעלים קובץ הקלטה - הוא נשלח ישירות ל-Supabase Storage (bucket
   `recordings`), ונוצרת שורה בטבלת `transcription_jobs` עם סטטוס `pending`.
2. ה-worker (התהליך הזה) סורק כל כמה שניות אחר עבודות `pending`, לוקח את
   הישנה ביותר, ומריץ:
   - **תמלול** עם [faster-whisper](https://github.com/SYSTRAN/faster-whisper),
     כברירת מחדל עם מודל [ivrit-ai](https://huggingface.co/ivrit-ai) שכוונן
     במיוחד לעברית (דיוק גבוה משמעותית ממודל Whisper רגיל).
   - **זיהוי דוברים** (מי דיבר מתי, לא מי זה בשם) עם
     [pyannote.audio](https://github.com/pyannote/pyannote-audio).
   - **מיזוג** תוצאות התמלול וזיהוי הדוברים לרצף משפטים לפי דובר.
   - **ניחוש שמות דוברים** (אופציונלי) - שולח את התמלול המלא ל-Claude API
     ומבקש לזהות שמות אמיתיים לפי הצגה עצמית/פנייה בשם בתוך השיחה עצמה. אם
     אין רמז כזה בהקלטה, או שלא הוגדר מפתח API, הדובר נשאר "דובר 1", "דובר
     2" וכו' - ניתנים לשינוי ידני במסך.
3. האתר סורק את הסטטוס כל כמה שניות ומציג את ההתקדמות, ולבסוף את התמלול
   המלא עם אפשרות לשנות שמות דוברים ולייצא ל-TXT / SRT / Word.

## דרישות מקדימות

- Python 3.10+.
- **ffmpeg** מותקן במערכת (`sudo apt-get install ffmpeg` / `brew install ffmpeg`).
- **GPU של NVIDIA מומלץ מאוד**. על CPU בלבד תמלול+זיהוי דוברים של הקלטה
  ל-3-4 שעות עלול לקחת שעות רבות; עם GPU סביר (למשל RTX 3060 ומעלה) זה
  אמור לקחת בסביבות רבע-חצי מאורך ההקלטה.
- חשבון [Hugging Face](https://huggingface.co/join) + טוקן, ואישור תנאי
  השימוש של המודלים:
  - https://huggingface.co/pyannote/speaker-diarization-3.1
  - https://huggingface.co/pyannote/segmentation-3.0
- (אופציונלי, לניחוש שמות דוברים) מפתח API של
  [Anthropic](https://console.anthropic.com/).
- אותו פרויקט Supabase של האתר הראשי, עם `supabase/schema.sql` המעודכן
  (כולל טבלת `transcription_jobs` ו-bucket `recordings`) כבר מורץ.

## התקנה והרצה

```bash
cd transcription_worker
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

אם יש GPU של NVIDIA, ודאו ש-PyTorch מותקן עם תמיכת CUDA המתאימה לכרטיס שלכם
(ראו הוראות ב-https://pytorch.org/get-started/locally/ - ייתכן שתצטרכו
להתקין גרסת torch ספציפית לפני `pip install -r requirements.txt`, לפי גרסת
ה-CUDA שמותקנת אצלכם).

```bash
cp .env.example .env
```

ואז ערכו את `.env` עם `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `HF_TOKEN`,
ואופציונלית `ANTHROPIC_API_KEY`.

הרצה:

```bash
python -m worker.main
```

ה-worker ירוץ ברקע (מודפס לוג לכל עבודה), וימשיך לסרוק עבודות חדשות. מומלץ
להריץ אותו כשירות קבוע (systemd, Docker, tmux/screen) כדי שימשיך לפעול גם
אחרי ניתוק. **הריצו רק worker אחד בו-זמנית** - יש נעילה בסיסית מול מרוץ בין
כמה worker-ים, אבל היא לא נועדה לתמוך בכמה worker-ים פועלים במקביל.

### Docker (CPU, ברירת מחדל)

```bash
docker build -t tirat-carmel-transcription-worker .
docker run --env-file .env tirat-carmel-transcription-worker
```

לשימוש ב-GPU בתוך Docker, יש להריץ עם
[NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html)
(`docker run --gpus all ...`) ולעדכן את משתני הסביבה `WHISPER_DEVICE=cuda`,
`DIARIZATION_DEVICE=cuda`, `WHISPER_COMPUTE_TYPE=float16`.

### systemd (הרצה קבועה על שרת לינוקס)

```ini
# /etc/systemd/system/transcription-worker.service
[Unit]
Description=Tirat Carmel transcription worker
After=network.target

[Service]
WorkingDirectory=/path/to/transcription_worker
ExecStart=/path/to/transcription_worker/venv/bin/python -m worker.main
Restart=always
EnvironmentFile=/path/to/transcription_worker/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now transcription-worker
```

## מבנה הפרויקט

```
transcription_worker/
  worker/
    main.py                 # לולאת ה-polling הראשית
    config.py                # משתני סביבה
    pipeline/
      supabase_rest.py        # קריאת/כתיבת עבודות + הורדת קבצים מ-Supabase
      download.py              # הורדת ההקלטה לקובץ זמני
      transcribe.py             # faster-whisper (עברית)
      diarize.py                 # pyannote.audio (זיהוי דוברים)
      merge.py                    # מיזוג תמלול + זיהוי דוברים
      speaker_names.py             # ניחוש שמות דוברים דרך Claude API
  requirements.txt
  Dockerfile
  .env.example
```

## פרטיות

הקלטות שיחה מכילות מידע אישי (ולעיתים רגיש) של תושבים/עובדים. הקבצים
נשמרים ב-bucket פרטי ב-Supabase (לא נגיש לציבור), אך מומלץ:

- לקבוע מדיניות שמירה/מחיקה (מסך הניהול כולל כפתור מחיקה לכל הקלטה ותמלול).
- לוודא מול היועץ המשפטי/הממונה על הגנת הפרטיות של העירייה שיש הרשאה
  מתאימה להקלטה ותמלול השיחות הרלוונטיות, ושהמשתתפים מיודעים על כך.
- לשקול הגבלת גישה נוספת (VPN/רשת פנימית) לשרת שמריץ את ה-worker, מעבר
  לסיסמת מסך הניהול.

זו אינה ייעוץ משפטי - רק תזכורת לבדוק את הנושא מול הגורמים המתאימים.

## פתרון בעיות

- **"CUDA out of memory"** - הקטינו `WHISPER_COMPUTE_TYPE` ל-`int8_float16`
  או `int8`, או השתמשו במודל Whisper קטן יותר.
- **זיהוי דוברים נכשל עם שגיאת הרשאות/401 מ-Hugging Face** - ודאו שאישרתם
  את תנאי השימוש בשני עמודי המודלים לעיל *עם אותו חשבון* שהטוקן שייך לו.
- **תמלול איטי מאוד** - בלי GPU זה צפוי; שקלו שרת ענן עם GPU (למשל
  Lambda Labs / RunPod / Vast.ai) להרצת ה-worker, גם אם רק כשיש הקלטות
  לתמלל.
- **שמות דוברים לא זוהו** - תקין אם אף אחד לא הזדהה בשם בהקלטה עצמה; שנו
  ידנית במסך "תמלול הקלטות" באתר.
