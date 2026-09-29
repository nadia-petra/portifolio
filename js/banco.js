/* =====================================================================
   CONEXÃO COM O BANCO (Supabase)
   Este arquivo é usado pelo portfólio, pelo login e pelo admin.
   Aqui ficam só o endereço do projeto e a chave PÚBLICA, que pode
   aparecer no site sem problema: quem protege os dados é o RLS
   configurado no banco.sql. Nunca coloque a chave secreta aqui.
   Precisa ser carregado depois do script do Supabase (CDN).
   ===================================================================== */
(function () {
  var URL_DO_PROJETO = "https://mnkbyplpzecxraaohzzr.supabase.co";
  var CHAVE_PUBLICA = "sb_publishable_jLj0Lb2C1HgrFGRs7XoWMw_SB7zDFn9";

  // O e-mail que pode entrar no admin (usado só para mensagens na tela;
  // quem realmente tranca os dados é o banco).
  window.NP_EMAIL_ADMIN = "nadiapetraugc@gmail.com";

  // Se o script do Supabase não carregou (sem internet, por exemplo),
  // "banco" fica vazio e cada página segue funcionando do jeito dela.
  window.banco = (window.supabase && typeof window.supabase.createClient === "function")
    ? window.supabase.createClient(URL_DO_PROJETO, CHAVE_PUBLICA)
    : null;
})();
