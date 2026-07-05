# תמלול הקלטות בעברית (כלי עצמאי, Render/מקומי)

כלי עצמאי (Python + FastAPI, ללא תלות ב-Next.js/Supabase) שמעלה הקלטת שיחה
בעברית ומחזיר תמלול מלא, מחולק לפי דוברים - כולל הקלטות ארוכות של 3-4 שעות.
בנוי באותו דפוס בדיוק כמו `pdf_accessibility/`: עמוד HTML+JS פשוט (בלי
frameworks), FastAPI אחד, ופריסה ל-Render כשירות Web יחיד.

## מה הכלי עושה

1. **תמלול** עם [faster-whisper](https://github.com/SYSTRAN/faster-whisper),
   כברירת מחדל עם מודל [ivrit-ai](https://huggingface.co/ivrit-ai) שכוונן
   במיוחד לעברית.
2. **זיהוי דוברים** (מי דיבר מתי) עם
   [pyannote.audio](https://github.com/pyannote/pyannote-audio) - ניתן
   לכבות עם `ENABLE_DIARIZATION=false` אם אין טוקן Hugging Face.
3. **ניחוש שמות דוברים** (אופציונלי, דורש `ANTHROPIC_API_KEY`) - שולח את
   התמלול המלא ל-Claude ומבקש לזהות שמות אמיתיים לפי הצגה עצמית/פנייה בשם
   בתוך השיחה עצמה. בלי רמז כזה בהקלטה, הדובר נשאר "דובר 1" וכו' - ניתן
   לשנות ידנית במסך.
4. **ייצוא** ל-TXT / SRT / Word (docx), מיוצר בזמן ההורדה כך שינוי שם דובר
   לא דורש הרצה מחדש.

העיבוד רץ ברקע (thread) אחרי שההעלאה מסתיימת; המסך סורק את הסטטוס כל
כמה שניות ומציג התקדמות, ולבסוף את התמלול.

## מגבלות ידועות (חשוב לקרוא!)

- **מצב העבודות נשמר בזיכרון התהליך בלבד** (כמו ב-`pdf_accessibility`) -
  הפעלה מחדש של השרת (כולל deploy חדש, קריסה, או "הירדמות" של שירות חינמי
  ב-Render מחוסר פעילות) **מוחקת עבודות שבתהליך ואת ההיסטוריה**. ראו
  "פריסה ל-Render" למטה לגבי בחירת תוכנית שלא נרדמת.
- **בלי GPU, תמלול+זיהוי דוברים איטיים משמעותית**. הקלטה של 3-4 שעות
  יכולה לקחת מספר שעות טובות על CPU רגיל, תלוי בגודל המודל ובחוזק המעבד.
- קבצי ההקלטה עצמם נמחקים אחרי העיבוד (רק התמלול נשאר בזיכרון) - אין
  אחסון קבוע/גיבוי מובנה.

## הרצה מקומית

```bash
cd audio_transcription
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

ערכו את `.env` - לפחות `HF_TOKEN` (לזיהוי דוברים) ואופציונלית
`ANTHROPIC_API_KEY` (לניחוש שמות). ואז:

```bash
uvicorn app.main:app --reload --port 8000
```

פתחו דפדפן בכתובת http://localhost:8000, העלו הקלטה, וצפו בהתקדמות.

## פריסה ל-Render

בדיוק כמו שהעליתם את `pdf_accessibility` לכתובת חיה ב-Render, אפשר להעלות
את `audio_transcription` באותו אופן:

1. ב-[Render](https://dashboard.render.com/) בחרו **New -> Web Service**
   וחברו את ה-repository הזה.
2. **Root Directory**: `audio_transcription`.
3. **Runtime**: `Docker` (מומלץ - כולל ffmpeg ותלויות מערכת, בלי הפתעות).
   Render יזהה את ה-`Dockerfile` הקיים בתיקייה אוטומטית.
   - חלופה: Runtime `Python 3`, Build Command `pip install -r requirements.txt`,
     Start Command `uvicorn app.main:app --host 0.0.0.0 --port $PORT` - פשוט
     יותר אך תלוי בכך שהתלויות הפייתוניות (`av`/PyAV) יביאו את כל מה שצריך
     בלי ffmpeg נפרד ברמת המערכת.
4. **Instance Type**: **לא Free!** תוכנית Free נרדמת אחרי חוסר פעילות
   ומגבילה זיכרון ל-512MB - לא מספיק למודלים האלה, וגם עלול להרוג עבודת
   תמלול שנמצאת באמצע עיבוד של שעות. בחרו תוכנית בתשלום שלא נרדמת ("Always
   On"), עם כמה שיותר RAM (מודל Whisper גדול + pyannote יחד יכולים לצרוך
   מספר GB).
5. הוסיפו את משתני הסביבה מ-`.env.example` תחת Environment Variables
   (לפחות `HF_TOKEN`; `ANTHROPIC_API_KEY` אופציונלי לניחוש שמות). אם אין לכם
   טוקן Hugging Face עדיין, אפשר להתחיל עם `ENABLE_DIARIZATION=false` כדי
   לקבל תמלול בלי חלוקה לדוברים, ולהפעיל את זה מאוחר יותר.
6. Deploy. תוך כמה דקות (בפעם הראשונה - הורדת המודלים לוקחת זמן) תקבלו
   כתובת חיה כמו `your-service.onrender.com`.

**חשוב:** אל תדחפו deploy חדש בזמן שהקלטה נמצאת באמצע עיבוד - זה יפעיל
מחדש את השירות ויאבד את העבודה (בגלל שמצב העבודות בזיכרון בלבד, לפי המגבלה
למעלה).

## מבנה הפרויקט

```
audio_transcription/
  app/
    main.py                 # FastAPI: upload, status, transcript, download
    config.py                # משתני סביבה
    static/                  # index.html + app.js + style.css (ללא frameworks)
    pipeline/
      transcribe.py           # faster-whisper (עברית)
      diarize.py               # pyannote.audio (זיהוי דוברים)
      merge.py                  # מיזוג תמלול + זיהוי דוברים
      speaker_names.py           # ניחוש שמות דוברים דרך Claude API
      export.py                   # ייצוא TXT/SRT
      docx_export.py               # ייצוא Word
      runner.py                     # מצב עבודות בזיכרון + הרצת הצינור
  storage/                   # קבצים זמניים בזמן עיבוד (נמחקים אח"כ) - ב-gitignore
  requirements.txt
  Dockerfile
  .env.example
```

## פרטיות

הקלטות שיחה מכילות מידע אישי (ולעיתים רגיש). מומלץ לוודא מול היועץ
המשפטי/הממונה על הגנת הפרטיות שיש הרשאה מתאימה להקלטה ותמלול השיחות
הרלוונטיות, ושהמשתתפים מיודעים על כך, ולשקול הגבלת גישה לכתובת ה-Render
(למשל דרך Render's IP allowlisting אם זמין בתוכנית שלכם) מעבר לכך שהיא
לא מקושרת מהאתר הראשי. זו אינה ייעוץ משפטי.

## פתרון בעיות

- **"CUDA out of memory" / תהליך נהרג באמצע (OOM)** - הקטינו את
  `WHISPER_COMPUTE_TYPE` ל-`int8`, השתמשו במודל Whisper קטן יותר, או עברו
  לתוכנית Render עם יותר RAM.
- **זיהוי דוברים נכשל עם שגיאת הרשאות/401 מ-Hugging Face** - ודאו שאישרתם
  את תנאי השימוש בשני עמודי המודלים (למעלה) *עם אותו חשבון* שהטוקן שייך לו.
- **תמלול איטי מאוד** - צפוי בלי GPU; שקלו תוכנית Render חזקה יותר, מודל
  Whisper קטן יותר, או הרצה על שרת עם GPU (ראו `transcription_worker/`
  לגרסה המיועדת לעבודה מול Supabase + worker על שרת GPU משלכם).
- **שמות דוברים לא זוהו** - תקין אם אף אחד לא הזדהה בשם בהקלטה עצמה; שנו
  ידנית במסך.
