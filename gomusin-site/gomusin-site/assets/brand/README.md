# 브랜드 사진 넣는 곳

이 폴더에 로고와 사진 파일을 넣고, `js/brand.js` 에 파일 경로를 적으면 사이트에 나타나요.
비워 둔 항목은 화면에 나오지 않으니, 있는 것부터 하나씩 넣어도 괜찮아요.
(채팅에 파일을 올려 주시면 Claude가 대신 넣어 드려요.)

## 무엇을, 어떤 크기로

| 파일 예시 | 들어가는 곳 | 권장 규격 |
|---|---|---|
| `logo.svg` 또는 `logo.png` | 상단 바 + 검색창 위 큰 로고 | 가로형, **배경 투명**, PNG면 가로 800px 이상 |
| `store-01.jpg` ~ `store-06.jpg` | 홈 아래 "공간을 소개해요" 갤러리 | 가로 1600px 이상, 3~6장 |
| `store-gangnam.jpg` 등 | 매장 안내 목록·지도 정보창 | 16:9, 가로 1200px |
| `product-ebook.jpg` 등 | 상점 상품 카드 | 4:3, 가로 1000px |

- 파일 이름은 **영어 소문자·숫자·하이픈**만 써 주세요. (예: `store-01.jpg`, 한글·띄어쓰기 X)
- 한 장에 **500KB 이하**가 좋아요. 큰 사진은 https://squoosh.app 에서 줄이면 돼요. (품질 75, WebP 또는 JPG)
- 사람 얼굴이 나오는 사진은 본인 동의를 받은 것만 써 주세요.

## 잘 나오는 사진 고르는 법 (AI 느낌 없애기)

1. **실제 공간 사진 3종 세트**: 외관 1장, 내부 전체 1장, 손이나 작업 디테일 1장
2. **같은 시간대·같은 색감**으로 찍은 사진끼리 모으기 (낮 자연광 추천)
3. 사진 속 텍스트·간판은 최소로. 사이트 글자와 겹쳐 보이지 않게
4. 스톡 사진·AI 생성 사진보다, 조금 서툴러도 **진짜 내 가게 사진**이 훨씬 신뢰감을 줘요

## brand.js 예시

```js
window.BRAND = {
  name: "심플 스튜디오",
  logo: "assets/brand/logo.svg",
  tagline: "오늘 필요한 답을, 가장 간단하게",
  gallery: [
    { src: "assets/brand/store-01.jpg", caption: "강남점 외관" },
    { src: "assets/brand/store-02.jpg" },
    { src: "assets/brand/store-03.jpg" }
  ],
  storePhotos: { s1: "assets/brand/store-gangnam.jpg" },
  productPhotos: { g1: "assets/brand/product-ebook.jpg" },
  business: { company: "심플 스튜디오", ceo: "홍길동", regNo: "000-00-00000" }
};
```
