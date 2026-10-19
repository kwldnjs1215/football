# ⚽ 풋살 MBTI

여성 풋살러를 위한 풋살 성격 테스트. 실력이 아니라 **풋살장에서의 나**를 발견하는 16유형 테스트입니다.

## 4가지 성향 축

| 축 | A | B |
|---|---|---|
| 공을 잡으면 | **D** 돌파형 | **P** 연계형 |
| 경기 중 판단 | **I** 직감형 | **O** 관찰형 |
| 경기 몰입 | **F** 승부형 | **C** 즐겜형 |
| 팀 내 소통 | **L** 콜형 | **M** 묵묵형 |

축마다 5문항씩, 총 20문항. 각 축에서 3개 이상 고른 쪽이 그 축의 결과가 됩니다.

## 파일 구성

- `index.html`: 화면 구조 (시작 → 문항 → 결과 → 전체 유형)
- `data.js`: **문항과 16유형 설명 (내용 수정은 여기서)**
- `app.js`: 점수 계산·화면 전환·공유
- `style.css`: 디자인

빌드 과정 없는 순수 정적 사이트입니다.

## 로컬에서 보기

```bash
npx serve .
```

## 배포 (Cloudflare Pages)

1. GitHub에 이 폴더를 저장소로 올리기
2. Cloudflare 대시보드 → Workers & Pages → Create → Pages → Connect to Git
3. 저장소 선택, Framework preset: `None`, Build command: 비워두기, Build output directory: `/`
4. Deploy → `프로젝트이름.pages.dev` 주소가 생깁니다
5. (선택) Custom domains 탭에서 구매한 도메인 연결

이후 GitHub에 push할 때마다 자동으로 다시 배포됩니다.
