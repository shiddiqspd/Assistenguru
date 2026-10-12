import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize server-side Gemini client
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health and status endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(apiKey),
      model: 'gemini-3.8-flash',
    });
  });

  // Main generation endpoint
  app.post('/api/generate-document', async (req, res) => {
    try {
      const { docType, mapel, fase, semester, alokasi, topik, model, sekolah, guru, kepalaSekolah, p3Text } = req.body;

      if (!mapel || !topik) {
        return res.status(400).json({ error: 'Mata pelajaran dan topik wajib diisi' });
      }

      if (!apiKey) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY belum dikonfigurasi di environment server. Pastikan API key terpasang di Secrets panel.',
        });
      }

      const pengesahanText = kepalaSekolah
        ? `
---

## LEMBAR PENGESAHAN

Mengetahui,  
**Kepala ${sekolah || 'SMA'}**  

\n\n\n

**${kepalaSekolah}**  
NIP. .....................................  

Guru Mata Pelajaran ${mapel}  

\n\n\n

**${guru || 'Penyusun'}**  
NIP. .....................................
`
        : `
---
**Penyusun:** ${guru || 'Penyusun'}  
**Satuan Pendidikan:** ${sekolah || 'SMA'}
`;

      let promptText = '';

      if (docType === 'MA') {
        promptText = `Bertindaklah sebagai Ahli Pengembang Kurikulum Kemendikbudristek RI dan Guru Penggerak Ahli.
Susun DOKUMEN MODUL AJAR SMA LENGKAP & MENDALAM sesuai standar Permendikbudristek No. 12/2024 dan Panduan Pembelajaran dan Asesmen (PPA) Kurikulum Merdeka dengan rincian berikut:
- Mata Pelajaran: ${mapel}
- Fase / Kelas: ${fase}
- Semester: ${semester}
- Alokasi Waktu: ${alokasi}
- Topik / Materi Utama: ${topik}
- Model Pembelajaran: ${model}
- Satuan Pendidikan: ${sekolah}
- Guru Penyusun: ${guru}
- Profil Pelajar Pancasila:
${p3Text}

Gunakan format struktur baku berikut secara detail, komprehensif, dan siap ajar (jangan diringkas, jangan gunakan placeholder singkat):

# MODUL AJAR
## MATA PELAJARAN: ${mapel.toUpperCase()}
### TOPIK: ${topik.toUpperCase()}

---

### INFORMASI UMUM

#### I. IDENTITAS MODUL
| Identitas | Keterangan |
| :--- | :--- |
| **Nama Penyusun** | ${guru} |
| **Satuan Pendidikan** | ${sekolah} |
| **Fase / Kelas** | ${fase} |
| **Mata Pelajaran** | ${mapel} |
| **Semester** | ${semester} |
| **Alokasi Waktu** | ${alokasi} |
| **Tahun Pelajaran** | 2026/2027 |

#### II. KOMPETENSI AWAL
Tuliskan 2-3 kompetensi prasyarat spesifik yang harus dikuasai siswa sebelum mempelajari materi ini.

#### III. PROFIL PELAJAR PANCASILA (P3)
${p3Text}
(Jelaskan bagaimana dimensi-dimensi di atas terinternalisasi dalam proses pembelajaran topik ini).

#### IV. SARANA DAN PRASARANA
Sajikan tabel sarana, media, alat, dan sumber bahan ajar yang relevan dengan pembelajaran SMA modern dan kontekstual.

#### V. TARGET PESERTA DIDIK
- Peserta didik reguler/tipikal: umum, tidak ada kesulitan dalam mencerna dan memahami materi ajar.
- Diferensiasi bagi peserta didik dengan kecepatan belajar tinggi dan yang membutuhkan bimbingan bertahap.

#### VI. MODEL PEMBELAJARAN
Model: **${model}**
Pendekatan: Student-centered, berbasis diferensiasi (konten, proses, produk), dan pembelajaran mendalam (Deep Learning: Mindful, Meaningful, Joyful).

---

### KOMPONEN INTI

#### I. TUJUAN PEMBELAJARAN (TP)
Rumuskan minimal 3 Tujuan Pembelajaran yang terukur, mencakup aspek Audience, Behavior, Condition, Degree (ABCD) dan ranah HOTS (C4-C6).

#### II. PEMAHAMAN BERMAKNA
Jelaskan pemahaman esensial dan relevansi praktis kehidupan nyata terkait materi ${topik}.

#### III. PERTANYAAN PEMANTIK
Buat minimal 3 pertanyaan pemantik berbasis masalah kontekstual yang merangsang nalar kritis siswa.

#### IV. KEGIATAN PEMBELAJARAN
Rancang skenario pembelajaran yang detail dan terstruktur langkah per langkah untuk:
- **Pertemuan 1 (${alokasi}):**
  - Kegiatan Pendahuluan (15 Menit): Orientasi, apersepsi kontekstual, motivasi, penyampaian tujuan & asesmen.
  - Kegiatan Inti (dengan sintaks spesifik dari model ${model}) beserta diferensiasi proses dan kerja kelompok kolaboratif.
  - Kegiatan Penutup (15 Menit): Kesimpulan bersama siswa, refleksi formatif, tindak lanjut, dan doa.
- **Pertemuan 2:**
  - Kegiatan Pendahuluan (15 Menit).
  - Kegiatan Inti: Presentasi hasil/produk tugas, asesmen rekan sejawat, umpan balik bermakna dari guru.
  - Kegiatan Penutup (15 Menit): Evaluasi, penguatan konsep, dan rencana pertemuan selanjutnya.

#### V. ASESMEN PEMBELAJARAN
Rancang instrumen asesmen yang konkret:
1. **Asesmen Diagnostik** (Non-kognitif & Kognitif awal)
2. **Asesmen Formatif** (Rubrik observasi sikap P3 & performa diskusi kelompok)
3. **Asesmen Sumatif** (Tes tertulis/unjuk kerja/proyek dilengkapi Kisi-kisi dan Kriteria Ketercapaian Tujuan Pembelajaran / KKTP)

#### VI. PENGAYAAN DAN REMEDIAL
- **Kegiatan Pengayaan:** Tugas eksploratif tingkat lanjut untuk siswa tuntas.
- **Kegiatan Remedial:** Pembimbingan ulang konsep esensial dengan scaffolding terstruktur bagi siswa yang belum mencapai KKTP.

#### VII. REFLEKSI GURU DAN PESERTA DIDIK
- Daftar pertanyaan refleksi untuk peserta didik.
- Daftar pertanyaan refleksi untuk evaluasi diri guru.

---

### LAMPIRAN-LAMPIRAN LENGKAP

#### Lampiran 1: LEMBAR KERJA PESERTA DIDIK (LKPD)
Buatkan LKPD yang lengkap dengan: Judul LKPD, Petunjuk Belajar, Alat/Bahan, Langkah Kerja Berkelompok, Pertanyaan Analisis/Tabel Isian Kerja, serta Kesimpulan.

#### Lampiran 2: BAHAN BACAAN GURU DAN PESERTA DIDIK
Uraikan ringkasan materi ajar yang substantif, padat, dan ilmiah mengenai ${topik}.

#### Lampiran 3: GLOSARIUM
Daftar minimal 5 istilah teknis penting beserta definisinya.

#### Lampiran 4: DAFTAR PUSTAKA
Daftar referensi buku dan sumber ilmiah relevan standar Kurikulum Merdeka.

${pengesahanText}`;
      } else if (docType === 'ATP') {
        promptText = `Bertindaklah sebagai Ahli Kurikulum Kemendikbudristek RI.
Buatkan DOKUMEN ALUR TUJUAN PEMBELAJARAN (ATP) ${mapel} SMA yang komprehensif dan profesional untuk:
- Fase/Kelas: ${fase}
- Semester: ${semester}
- Materi Pokok: ${topik}
- Satuan Pendidikan: ${sekolah}
- Guru: ${guru}

Susun dalam format dokumen resmi Kurikulum Merdeka:
1. **Identitas Dokumen ATP**
2. **Rasional dan Karakteristik Mata Pelajaran**
3. **Capaian Pembelajaran (CP) Fase**
4. **Tabel Pemetaan Alur Tujuan Pembelajaran (ATP):**
   Buat tabel Markdown terstruktur dengan kolom:
   | No | Elemen Capaian | Capaian Pembelajaran (CP) | Tujuan Pembelajaran (TP) | Alokasi Waktu (JP) | Dimensi P3 | Indikator Ketercapaian (IKTP) | Asesmen | Kata Kunci Materi |
5. **Prinsip dan Alur Urutan Pembelajaran** (Logika pedagogis alur dari TP 1 hingga akhir)
6. ${pengesahanText}`;
      } else if (docType === 'CP') {
        promptText = `Bertindaklah sebagai Pengembang Kurikulum Kemendikbudristek RI.
Buatkan DOKUMEN CAPAIAN PEMBELAJARAN (CP) MATA PELAJARAN ${mapel} SMA untuk ${fase} berdasarkan Keputusan BSKAP Kemendikbudristek RI terbaru terkait topik: ${topik}.

Sajikan dokumen resmi yang memuat:
1. **Identitas Dokumen & Mata Pelajaran** (${mapel} - ${fase} - ${sekolah})
2. **Rasional Mata Pelajaran ${mapel} di SMA**
3. **Tujuan Mata Pelajaran**
4. **Karakteristik Mata Pelajaran & Penjelasan Elemen**
5. **Capaian Pembelajaran Fase Keseluruhan**
6. **Tabel Rincian Capaian Pembelajaran Per Elemen** (disertai uraian kemampuan akhir fase pada elemen terkait materi ${topik})
7. **Peta Integrasi Profil Pelajar Pancasila**
8. ${pengesahanText}`;
      } else if (docType === 'PROTA') {
        promptText = `Bertindaklah sebagai Tim Kurikulum SMA.
Buatkan DOKUMEN PROGRAM TAHUNAN (PROTA) resmi untuk:
- Mata Pelajaran: ${mapel}
- Fase/Kelas: ${fase}
- Satuan Pendidikan: ${sekolah}
- Guru Penyusun: ${guru}
- Tahun Pelajaran: 2026/2027
- Fokus Topik Utama: ${topik}

Sajikan dalam bentuk dokumen resmi yang memuat:
1. **Identitas Program Tahunan**
2. **Analisis Alokasi Waktu Efektif Satu Tahun** (Semester Ganjil dan Genap)
3. **Tabel Distribusi Program Tahunan:**
   Buatkan tabel Markdown terperinci:
   | No | Semester | Elemen | Materi Pokok / Lingkup Materi | Alokasi Waktu Intrakurikuler (JP) | Alokasi Kokurikuler P5 (JP) | Keterangan |
4. **Rekapitulasi Total JP Setahun**
5. ${pengesahanText}`;
      } else if (docType === 'PROSEM') {
        promptText = `Bertindaklah sebagai Tim Kurikulum SMA.
Buatkan DOKUMEN PROGRAM SEMESTER (PROSEM) resmi untuk:
- Mata Pelajaran: ${mapel}
- Fase/Kelas: ${fase}
- Semester: ${semester}
- Satuan Pendidikan: ${sekolah}
- Guru Penyusun: ${guru}
- Topik: ${topik}

Sajikan dalam bentuk dokumen resmi yang memuat:
1. **Identitas Program Semester**
2. **Perhitungan Jam Pelajaran Efektif Semester ${semester}**
3. **Tabel Pemetaan Distribusi Materi Per Minggu Per Bulan** dalam format tabel Markdown (kolom: No, Materi Pokok/Tujuan Pembelajaran, Total JP, Distribusi Pekan ke-1 s.d ke-4/5 tiap bulan pada semester ini, Asesmen Sumatif, Cadangan JP).
4. **Catatan Pelaksanaan dan Evaluasi**
5. ${pengesahanText}`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptText,
        config: {
          systemInstruction:
            'Anda adalah Asisten Pakar Kurikulum Merdeka Kemendikbudristek RI tingkat SMA berprestasi tinggi. Anda menghasilkan dokumen perangkat ajar resmi, mendalam, kaya substansi, terstruktur rapi dengan tabel Markdown, serta menggunakan istilah pedagogis mutakhir (Permendikbudristek No. 12/2024, BSKAP, Taksonomi Bloom HOTS, Deep Learning, dan PPA Kurikulum Merdeka).',
          temperature: 0.7,
        },
      });

      const markdown = response.text || '';
      return res.json({ success: true, markdown });
    } catch (err: unknown) {
      console.error('Error generating document:', err);
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan pada server saat memproses Gemini API';
      return res.status(500).json({ error: errorMessage });
    }
  });

  // Refine existing document endpoint
  app.post('/api/refine-document', async (req, res) => {
    try {
      const { previousMarkdown, instruction, docType } = req.body;

      if (!previousMarkdown || !instruction) {
        return res.status(400).json({ error: 'Dokumen sebelumnya dan instruksi perbaikan wajib diisi' });
      }

      if (!apiKey) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY belum dikonfigurasi di environment server. Pastikan API key terpasang di Secrets panel.',
        });
      }

      const promptText = `Berikut adalah dokumen perangkat ajar Kurikulum Merdeka SMA (${docType || 'Perangkat Ajar'}) yang telah disusun:

\`\`\`markdown
${previousMarkdown}
\`\`\`

Instruksi perbaikan/penyempurnaan dari Guru:
"${instruction}"

Tugas Anda:
Perbarui dan sempurnakan dokumen perangkat ajar di atas secara utuh. Pertahankan seluruh struktur baku, tabel, dan format Kurikulum Merdeka SMA, lalu terapkan instruksi guru secara presisi dan mendalam. Keluarkan seluruh hasil dokumen baru dalam format Markdown lengkap tanpa terpotong.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptText,
        config: {
          systemInstruction:
            'Anda adalah Asisten Pakar Kurikulum Merdeka Kemendikbudristek RI tingkat SMA. Anda bertugas menyempurnakan dokumen perangkat ajar sesuai instruksi guru dengan standar akademik tinggi dan format Markdown yang rapi.',
          temperature: 0.7,
        },
      });

      const markdown = response.text || '';
      return res.json({ success: true, markdown });
    } catch (err: unknown) {
      console.error('Error refining document:', err);
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan pada perbaikan dokumen';
      return res.status(500).json({ error: errorMessage });
    }
  });

  // Vite middleware in dev or static files in prod
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server aktif di http://0.0.0.0:${PORT}`);
  });
}

startServer();
