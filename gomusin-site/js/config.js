/* =========================================================
   공개해도 되는 설정값만 넣는 파일이에요.
   - SUPABASE_URL, SUPABASE_ANON_KEY: 공개용 키예요. (보안은 DB의 RLS 규칙이 지켜요)
   - KAKAO_MAP_KEY: 카카오 "JavaScript 키"예요. 카카오 콘솔에 등록한 도메인에서만 동작해요.
   - PG_CLIENT_KEY: 토스페이먼츠 "클라이언트 키"예요. (시크릿 키는 절대 여기에 넣지 마세요!)

   ⚠ PG_SECRET_KEY, Resend API 키 같은 "비밀 키"는 이 파일에 넣지 마세요.
     비밀 키는 Vercel 환경변수에만 넣고, api/ 폴더의 서버 함수에서만 읽어요.

   배포할 때는 Vercel이 /api/config 에서 이 값을 내려주도록 되어 있어서,
   이 파일은 비워 둔 채로 두면 돼요. (backend/GUIDE.md 6단계 참고)
   ========================================================= */
window.APP_CONFIG = {
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",
  KAKAO_MAP_KEY: "",
  PG_CLIENT_KEY: ""
};
