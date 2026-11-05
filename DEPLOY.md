# 배포 안내 (GitHub Pages)

이 폴더는 Cho SeungHyun 포트폴리오(새 레이아웃 `next-concept/`)를 배포하는 데 필요한 파일만 모은 것입니다.

## 폴더 구성

| 경로 | 내용 |
|---|---|
| `index.html` | 접속하면 `next-concept/`로 바로 이동합니다. |
| `next-concept/` | 사이트 본체: HTML, CSS, JS, 최적화 이미지, 글꼴, three.js |
| `assets/` | 사이트가 실제로 쓰는 원본 이미지와 툴 아이콘만 들어 있습니다. |
| `media/` | 사이트가 실제로 쓰는 영상(mp4)만 들어 있습니다. 파일마다 100MB 미만입니다. |
| `.nojekyll` | GitHub Pages가 파일을 가공하지 않고 그대로 보여 주게 합니다. 지우지 마세요. |
| `run-local.cmd` | 내 PC에서 미리 보기용 로컬 서버를 실행합니다(Python 3 필요). |
| `_dev/` | 개발 기록(`README.md`, `ELEMENTAL-TRANSFORM-ANALYSIS.md`)과 이미지 최적화 스크립트입니다. 사이트 동작과는 관계없습니다. |

`next-concept/`는 상위 폴더의 `assets/`, `media/`를 상대 경로(`../`)로 불러옵니다. 폴더 구조를 바꾸지 말고 그대로 올려 주세요.

## 1. 내 PC에서 먼저 확인

1. `run-local.cmd`를 실행합니다.
2. 브라우저에서 http://127.0.0.1:4174/ 를 엽니다. `next-concept/`로 이동하면 정상입니다.
3. 로컬 주소에서만 화면 오른쪽 아래에 씨앗 디버그 패널이 보입니다. 배포된 사이트에서는 보이지 않습니다. 배포 주소에서 디버그 패널이 필요하면 주소 뒤에 `?growthDebug=1`을 붙입니다.

## 2. GitHub에 올리기

웹에서 올리는 방법:
1. GitHub에서 새 저장소(Repository)를 만듭니다. 예: `portfolio`
2. 저장소 화면의 **Add file → Upload files**에 이 폴더 안의 내용을 모두 끌어다 놓습니다. 폴더째 올라가야 하고, `.nojekyll`도 포함되어야 합니다.
   - 웹 업로드는 한 번에 100개 파일까지라 여러 번 나눠 올려야 할 수 있습니다. 이때는 아래 Git 방법이 편합니다.
3. **Commit changes**를 누릅니다.

Git으로 올리는 방법(Git 설치 필요):
```
cd 이_폴더_경로
git init
git add .
git commit -m "Portfolio site"
git branch -M main
git remote add origin https://github.com/<아이디>/<저장소이름>.git
git push -u origin main
```

## 3. GitHub Pages 켜기

1. 저장소의 **Settings → Pages**로 갑니다.
2. **Build and deployment**에서 Source를 **Deploy from a branch**로, Branch를 `main` / `/ (root)`로 고르고 **Save**를 누릅니다.
3. 1~2분 뒤 `https://<아이디>.github.io/<저장소이름>/`에서 열립니다. 들어가면 `.../next-concept/`로 이동합니다.
   - 저장소 이름을 `<아이디>.github.io`로 만들면 주소가 `https://<아이디>.github.io/`가 됩니다.

## 참고

- 전체 크기는 약 185MB입니다. 사이트 본체 17MB, 영상 82MB, 원본 이미지 86MB이고, 원본 이미지는 이미지를 크게 볼 때 쓰입니다. GitHub 파일 제한(파일당 100MB)과 Pages 사이트 제한(1GB)을 넘지 않습니다.
- 영상은 GitHub Pages에서 그대로 재생됩니다. 접속자가 많아 트래픽이 커지면(Pages 권장 월 100GB) 영상을 YouTube 등으로 옮기는 것을 고려하세요.
- 공유 미리보기 이미지(`og:image`)는 상대 경로입니다. 일부 메신저는 전체 주소가 필요할 수 있으니, 배포 주소가 정해지면 `next-concept/index.html`의 `og:image`, `twitter:image`를 `https://.../next-concept/assets/social-preview.jpg`처럼 바꾸면 됩니다.
- 원소 뱃지 습득 상태는 저장되지 않습니다. 새로고침하면 처음부터 시작합니다.
