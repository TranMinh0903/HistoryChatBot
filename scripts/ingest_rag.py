"""
Nạp tài liệu VNR202 vào bảng document_chunks (RAG).
- Trích text từ các PDF trong zip
- Chia đoạn (~900 ký tự)
- Embed bằng Gemini gemini-embedding-001 (768 chiều)
- Lưu vào Postgres (pgvector)

Chạy:  python scripts/ingest_rag.py
Key đọc từ .env (GEMINI_API_KEY). Chạy lại sẽ xóa dữ liệu cũ và nạp lại.
"""
import io, os, re, sys, time, zipfile
import pypdf, psycopg2, requests

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZIP_PATH = os.environ.get("VNR_ZIP", r"D:/FPTStudy/VNR/VNR202_updated SP24-20260511T002358Z-3-001.zip")
DB = dict(host="localhost", port=5432, dbname="lichsudang", user="postgres", password="postgres")
MODEL = "gemini-embedding-001"
DIM = 768
CHUNK = 900
BATCH = 16


def load_key():
    key = os.environ.get("GEMINI_API_KEY")
    if key:
        return key
    env = os.path.join(ROOT, ".env")
    if os.path.exists(env):
        for line in open(env, encoding="utf-8"):
            if line.startswith("GEMINI_API_KEY="):
                return line.split("=", 1)[1].strip()
    sys.exit("Khong tim thay GEMINI_API_KEY (env hoac .env)")


def clean(t):
    t = re.sub(r"[ \t]+", " ", t)
    t = re.sub(r"\n{2,}", "\n", t)
    return t.strip()


def chunk_text(text):
    text = clean(text)
    if len(text) < 40:
        return []
    parts, buf = [], ""
    for para in re.split(r"\n+", text):
        para = para.strip()
        if not para:
            continue
        if len(buf) + len(para) + 1 <= CHUNK:
            buf = (buf + "\n" + para).strip()
        else:
            if buf:
                parts.append(buf)
            buf = para if len(para) <= CHUNK else para[:CHUNK]
    if buf:
        parts.append(buf)
    return [p for p in parts if len(p) >= 40]


def embed_batch(key, texts):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:batchEmbedContents?key={key}"
    body = {"requests": [
        {"model": f"models/{MODEL}", "content": {"parts": [{"text": t}]}, "outputDimensionality": DIM}
        for t in texts
    ]}
    for attempt in range(5):
        r = requests.post(url, json=body, timeout=90)
        if r.status_code == 200:
            return [e["values"] for e in r.json()["embeddings"]]
        if r.status_code in (429, 503):
            wait = 5 * (attempt + 1)
            print(f"    rate-limit ({r.status_code}), cho {wait}s...")
            time.sleep(wait)
            continue
        raise RuntimeError(f"Gemini {r.status_code}: {r.text[:200]}")
    raise RuntimeError("Het luot thu embed")


def main():
    key = load_key()
    if not os.path.exists(ZIP_PATH):
        sys.exit(f"Khong thay zip: {ZIP_PATH}")

    conn = psycopg2.connect(**DB)
    cur = conn.cursor()
    cur.execute('DELETE FROM document_chunks;')
    conn.commit()
    print("Da xoa du lieu cu.")

    z = zipfile.ZipFile(ZIP_PATH)
    pdfs = sorted([n for n in z.namelist() if n.lower().endswith(".pdf")])
    print(f"Tim thay {len(pdfs)} PDF.")

    total = 0
    for name in pdfs:
        source = os.path.splitext(os.path.basename(name))[0]  # "Session 5"
        try:
            reader = pypdf.PdfReader(io.BytesIO(z.read(name)))
            text = "\n".join((p.extract_text() or "") for p in reader.pages)
        except Exception as e:
            print(f"  [SKIP] {source}: {e}")
            continue
        chunks = chunk_text(text)
        if not chunks:
            print(f"  [trong] {source}: khong co text")
            continue

        rows = []
        for i in range(0, len(chunks), BATCH):
            batch = chunks[i:i + BATCH]
            embs = embed_batch(key, batch)
            for c, e in zip(batch, embs):
                rows.append((source, c, "[" + ",".join(f"{x:.6f}" for x in e) + "]"))
            time.sleep(1.0)

        cur.executemany(
            'INSERT INTO document_chunks ("Id","Source","Content","Embedding","CreatedAt") '
            "VALUES (gen_random_uuid(), %s, %s, %s::vector, now());",
            rows,
        )
        conn.commit()
        total += len(rows)
        print(f"  [OK] {source}: {len(rows)} doan")

    cur.close()
    conn.close()
    print(f"\nHOAN TAT: nap {total} doan tu {len(pdfs)} PDF.")


if __name__ == "__main__":
    main()
