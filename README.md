# B.U.S. assist PIPOOH

หน้าผู้ช่วยเสียง B.U.S. สำหรับน้อง PIPOOH (ไฟล์เดียว `index.html`)

## เปิดดูในเครื่อง
ดับเบิลคลิก `index.html` หรือเปิดผ่าน Live Server

## ห้ามใส่ API Key ในไฟล์นี้
Claude API Key ต้องเก็บในฟังก์ชันฝั่งเซิร์ฟเวอร์ (เช่น Netlify Functions) ผ่าน Environment Variables เท่านั้น
ไฟล์ `.env` ถูกกันไว้ใน `.gitignore` แล้ว

## เตรียมไว้สำหรับขั้นต่อไป
- เพลง: ใส่ไฟล์ MP3 ไว้ในโฟลเดอร์ `music/` แล้วแก้รายชื่อเพลงในส่วน `TRACKS`
- AI: เพิ่มฟังก์ชันใน `netlify/functions/` แล้วเรียกจากหน้านี้
