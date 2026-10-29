# 포트폴리오 이동 · GitHub 업로드 패키지

2026-10-28 현재 `next-concept` 디자인의 독립 실행 복사본입니다.
원본 사이트를 변경하거나 GitHub에 업로드한 상태가 아닙니다.

## 다른 PC에서 확인

1. ZIP 파일을 전체 압축 해제합니다.
2. Python 3가 설치된 PC에서 `run-local.cmd`를 실행합니다.
3. 브라우저에서 http://127.0.0.1:4174/ 를 엽니다.
4. 현재 포트폴리오인 `/next-concept/`로 자동 이동합니다.
5. 종료는 서버 창에서 Ctrl+C입니다.

HTML 파일을 더블클릭해서 여는 대신 위 HTTP 주소를 사용하세요. JavaScript 모듈을 사용합니다.
Python이 없으면 Python 3를 설치하거나 VS Code Live Server로 **이 폴더 전체**를 열어 주세요.
YouTube와 Google Fonts는 인터넷 연결이 필요합니다. Slack은 조직 로그인 및 접근 권한이 필요합니다.

## GitHub Pages에 올리는 방법

GitHub Free에서는 공개(Public) 저장소로 구성합니다.

1. GitHub에서 새 저장소를 만듭니다. 예: `portfolio`.
2. **ZIP 자체가 아닌, 압축 해제한 폴더 내부의 파일과 폴더**를 저장소 최상단에 업로드합니다.
   저장소 바로 아래 `index.html`, `next-concept/`, `assets/`, `media/`가 있어야 합니다.
   상위 `portfolio-github-transfer-20261028` 폴더를 한 겹 더 넣지 마세요.
3. 웹 업로드는 `Add file → Upload files`로 진행합니다. 파일 수 제한에 걸리면 폴더별로 나누어 올리세요.
   GitHub Desktop을 쓰면 이 폴더의 내용을 새 저장소에 복사한 후 Commit / Publish하는 방식으로 전체를 올릴 수 있습니다.
4. 저장소 `Settings → Pages`에서 Source를 `Deploy from a branch`로 선택합니다.
5. Branch는 `main`, 폴더는 `/(root)`로 선택하고 Save합니다.
6. 배포가 끝나면 Pages 설정에 표시되는 사이트 주소를 엽니다.
   일반 저장소 주소는 `https://사용자명.github.io/portfolio/` 형태이며 현재 디자인으로 자동 이동합니다.
   `사용자명.github.io` 이름의 저장소라면 기본 주소는 `https://사용자명.github.io/`입니다.

`.nojekyll` 파일도 포함해서 올려주세요. 별도 npm 설치나 빌드는 필요 없습니다.

공식 안내: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## 포함한 현재 상태

- 현재 프로젝트 데이터, 상세 설명, 카테고리, 경력, 툴 Usage 인터랙션
- 원본 이미지, 웹용 WebP, 로고, Pretendard 폰트와 라이선스
- 현재 메인 영상 / 프로젝트에서 사용하는 로컬 영상 7개
- Toolkit YouTube: https://youtu.be/zBuRQKSIXgI
- Production Breakdown YouTube: https://youtu.be/R-7Lavq2Sdk
- 즉시 썸네일 호버 미리보기와 YouTube API 사전 준비
- 이메일 연락, KRAFTON Enterprise Slack 프로필, 하단 Outlook/Slack 아이콘

제외: 이전 루트 디자인, 오래된 dist, 서버 로그/PID, 사용하지 않는 01~08 영상과 이전 Production Breakdown 영상.
현재 페이지의 영상과 썸네일은 변경하지 않았습니다.

## 이후 수정할 파일

- `next-concept/catalog.js`: 프로젝트 제목/설명/분류/YouTube 링크
- `next-concept/profile.js`: 경력/툴 활용도/연락처
- `next-concept/styles.css`: 디자인
- `next-concept/app.js`: 페이지 동작
- `next-concept/hover-preview.js`: 썸네일 미리보기
- `next-concept/independent-card-layout.js`: 개별 카드 위치·주변 이동·페이지 높이 확보
- `next-concept/collection-hover.css`: 카드 펼침과 썸네일 오버레이
- `next-concept/compact-scroll.js`: 썸네일 전체 등장·재등장
- `next-concept/card-details-toggle.js`: 전체 펼침·접힘 컨트롤
- `assets/`: 이미지/로고 원본
- `media/`: 사용 중인 로컬 영상

이미지 원본 교체 후 웹용 파일 생성 방법은 `next-concept/README.md`를 참고하세요.
일부 기존 개발 문서/이미지 최적화 스크립트에는 제작 PC 경로가 남아 있을 수 있습니다.
사이트 실행은 상대 경로이므로 다른 PC 드라이브 위치와 무관합니다.

## 패키지 확인 범위

프로젝트 데이터의 로컬 에셋, 사용 중인 HTML/CSS/JS의 파일 참조, 파일 크기, SHA-256 목록 및 ZIP 무결성을 확인했습니다.
다른 PC 브라우저, GitHub 배포, YouTube 자동재생, 로그인된 Slack 이동은 아직 확인하지 않았습니다.
GitHub용 미리보기 MP4를 새로 압축한 패키지는 아닙니다. 기존 영상 품질을 유지했습니다.

## 이번 최신 패키지 반영 사항

- 프로젝트 소개 문구: Unreal Engine 시네마틱 제작 경험과 아트/개발/파이프라인 접근 방식 소개
- Selected Work 기간: 2015–2026
- Earlier Work 썸네일: 2015_rig.png / 2015_tool.png / 2015_project.png
- 화면을 채우는 메인 영상과 현재 텍스트 UI
- 6 px 썸네일 라운드와 16 px 제목, 올리브·살구색 카테고리
- 개별 카드 펼침과 주변 카드 이동, 최대 펼침 높이를 확보한 레이아웃
- COLLAPSE / EXPAND 전체 보기 컨트롤
- 프로젝트 영역 전체 등장과 위로 올라갔다 내려올 때 재등장
- Local AI 3D Generator 마지막 이미지 / Moodboard 네 번째 이미지 썸네일
- “Art, engineered. / For production.” 문구와 새 타이포그래피
- 상세 화면 최대 1760 px 너비
- 경력 스튜디오 이름의 글꼴·색상 통일 및 ROLE PROGRESSION 제거
- 현재 반응형 너비: 일반 창 1290 px 기준, 큰 화면 최대 1920 px

기존 패키지의 문구를 이어 쓰는 개발 이력은 `next-concept/README.md`에 남아 있습니다.
이 ZIP에는 위 최신 변경 사항까지 포함했습니다.
