// content/ 폴더 구조를 읽어 notes.json을 생성합니다.
// 폴더명 = 카테고리, 그 안의 .md 파일 = 노트.
// 각 .md 파일 상단에 --- 로 감싼 frontmatter를 적어주세요.
//
// 예시 (content/운동/스쿼트-가이드.md):
// ---
// title: 하체 필수 보강 루틴 및 스쿼트 교정 가이드
// subCategory: 하체근력
// date: 2026.09.12
// description: 스쿼트와 런지 시 무릎 통증을 방지하는 핵심 가이드입니다.
// youtubeId: dQw4w9WgXcQ
// linkedNotes: [근육학, 해부학]
// ---
// (본문은 선택사항 - description이 없을 때만 본문 앞부분을 사용합니다)

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', 'content');
const OUTPUT_FILE = path.join(__dirname, '..', 'notes.json');

function parseFrontmatter(raw) {
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) return { data: {}, body: raw.trim() };

    const [, fmBlock, body] = match;
    const data = {};

    fmBlock.split('\n').forEach(line => {
        if (!line.trim()) return;
        const idx = line.indexOf(':');
        if (idx === -1) return;

        const key = line.slice(0, idx).trim();
        let value = line.slice(idx + 1).trim();

        if (value.startsWith('[') && value.endsWith(']')) {
            value = value.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
        } else {
            value = value.replace(/^["']|["']$/g, '');
        }
        data[key] = value;
    });

    return { data, body: body.trim() };
}

function walkContent() {
    if (!fs.existsSync(CONTENT_DIR)) {
        console.log('content/ 폴더가 없어 빈 notes.json을 생성합니다.');
        fs.writeFileSync(OUTPUT_FILE, '[]\n');
        return;
    }

    const notes = [];
    let id = 1;

    const categories = fs.readdirSync(CONTENT_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

    categories.forEach(category => {
        const catPath = path.join(CONTENT_DIR, category);
        const files = fs.readdirSync(catPath).filter(f => f.endsWith('.md'));

        files.forEach(file => {
            const raw = fs.readFileSync(path.join(catPath, file), 'utf-8');
            const { data, body } = parseFrontmatter(raw);

            notes.push({
                id: id++,
                category,
                subCategory: data.subCategory || '',
                title: data.title || file.replace(/\.md$/, ''),
                date: data.date || '',
                description: data.description || body.slice(0, 140),
                hasVideo: Boolean(data.youtubeId),
                youtubeId: data.youtubeId || null,
                linkedNotes: Array.isArray(data.linkedNotes) ? data.linkedNotes : []
            });
        });
    });

    notes.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(notes, null, 2) + '\n');
    console.log(`notes.json 생성 완료 (노트 ${notes.length}개, 카테고리 ${categories.length}개)`);
}

walkContent();
