import type { AppLocale } from "./localeTypes";

/**
 * Supplementary UI-chrome translations.
 *
 * The main locale packs (`LocaleContext.tsx`) are complete for `en`, `ar` and
 * `zh`, but the remaining locales only ship a subset of keys. This file adds
 * the missing *chrome* strings — navigation group labels, the sign-out dialog,
 * and admin menu labels — so those languages read naturally instead of falling
 * back to English mid-interface.
 *
 * Applied by `LocaleProvider`'s `t()` as a layer between the locale pack and the
 * English call-site fallback.
 *
 * NOTE: best-effort translations of standard UI labels. They should be reviewed
 * by a native speaker before being treated as final; page-content translation is
 * tracked separately (`npm run i18n:report`).
 */
export const LOCALE_SUPPLEMENT: Partial<
  Record<AppLocale, Record<string, string>>
> = {
  // ── Group labels missing from every pack ────────────────────────────────
  en: {
    "layout.groupGlobal": "Global Intelligence",
    "layout.groupResources": "Resources",
  },
  ar: {
    "layout.groupGlobal": "الاستخبارات العالمية",
    "layout.groupResources": "الموارد",
  },
  zh: {
    "layout.groupGlobal": "全球情报",
    "layout.groupResources": "资源",
  },

  // ── Chrome keys missing from the non-en/ar/zh packs ─────────────────────
  fr: {
    "layout.groupGlobal": "Intelligence mondiale",
    "layout.groupResources": "Ressources",
    "layout.groupCyberOps": "Opérations cyber",
    "layout.signInPrompt": "Veuillez vous connecter pour continuer",
    "layout.signOutTitle": "Se déconnecter de DJAC ?",
    "layout.signOutDesc":
      "Choisissez ce que vous souhaitez faire après la déconnexion.",
    "layout.signInAgain": "Se reconnecter",
    "layout.signInAgainDesc": "Revenir à la page de connexion",
    "layout.registerNew": "Créer un nouveau compte",
    "layout.registerNewDesc": "Créer un nouveau compte DJAC",
    "layout.switchAccount": "Changer de compte",
    "layout.switchAccountDesc": "Se connecter en tant qu'utilisateur différent",
    "layout.menuOrgSettings": "Paramètres de l'organisation",
    "layout.menuAdminServiceRequests": "Gérer les demandes de service",
    "layout.menuAdminThreatIntel": "Publier le renseignement sur les menaces",
    "layout.menuAuditLog": "Journal d'audit",
    "layout.menuComplianceScorecard": "Tableau de bord de conformité",
    "layout.menuDsrTracker": "Suivi des demandes des personnes",
  },
  es: {
    "layout.groupGlobal": "Inteligencia global",
    "layout.groupResources": "Recursos",
    "layout.groupCyberOps": "Operaciones cibernéticas",
    "layout.signInPrompt": "Inicie sesión para continuar",
    "layout.signOutTitle": "¿Cerrar sesión en DJAC?",
    "layout.signOutDesc": "Elija qué hacer después de cerrar sesión.",
    "layout.signInAgain": "Iniciar sesión de nuevo",
    "layout.signInAgainDesc": "Volver a la página de inicio de sesión",
    "layout.registerNew": "Registrar una cuenta nueva",
    "layout.registerNewDesc": "Crear una nueva cuenta de DJAC",
    "layout.switchAccount": "Cambiar de cuenta",
    "layout.switchAccountDesc": "Iniciar sesión como otro usuario",
    "layout.menuOrgSettings": "Configuración de la organización",
    "layout.menuAdminServiceRequests": "Gestionar solicitudes de servicio",
    "layout.menuAdminThreatIntel": "Publicar inteligencia de amenazas",
    "layout.menuAuditLog": "Registro de auditoría",
    "layout.menuComplianceScorecard": "Cuadro de mando de cumplimiento",
    "layout.menuDsrTracker": "Seguimiento de solicitudes de interesados",
  },
  de: {
    "layout.groupGlobal": "Globale Intelligenz",
    "layout.groupResources": "Ressourcen",
    "layout.groupCyberOps": "Cyber-Operationen",
    "layout.signInPrompt": "Bitte melden Sie sich an, um fortzufahren",
    "layout.signOutTitle": "Von DJAC abmelden?",
    "layout.signOutDesc": "Wählen Sie, was nach dem Abmelden geschehen soll.",
    "layout.signInAgain": "Erneut anmelden",
    "layout.signInAgainDesc": "Zurück zur Anmeldeseite",
    "layout.registerNew": "Neues Konto registrieren",
    "layout.registerNewDesc": "Ein neues DJAC-Konto erstellen",
    "layout.switchAccount": "Konto wechseln",
    "layout.switchAccountDesc": "Als anderer Benutzer anmelden",
    "layout.menuOrgSettings": "Organisationseinstellungen",
    "layout.menuAdminServiceRequests": "Serviceanfragen verwalten",
    "layout.menuAdminThreatIntel": "Bedrohungsinformationen veröffentlichen",
    "layout.menuAuditLog": "Prüfprotokoll",
    "layout.menuComplianceScorecard": "Compliance-Scorecard",
    "layout.menuDsrTracker": "DSR-Tracker",
  },
  ja: {
    "layout.groupGlobal": "グローバルインテリジェンス",
    "layout.groupResources": "リソース",
    "layout.groupCyberOps": "サイバーオペレーション",
    "layout.signInPrompt": "続行するにはサインインしてください",
    "layout.signOutTitle": "DJAC からサインアウトしますか？",
    "layout.signOutDesc": "サインアウト後の動作を選択してください。",
    "layout.signInAgain": "再度サインイン",
    "layout.signInAgainDesc": "サインインページに戻る",
    "layout.registerNew": "新しいアカウントを登録",
    "layout.registerNewDesc": "新しい DJAC アカウントを作成",
    "layout.switchAccount": "アカウントを切り替え",
    "layout.switchAccountDesc": "別のユーザーとしてサインイン",
    "layout.menuOrgSettings": "組織設定",
    "layout.menuAdminServiceRequests": "サービスリクエストの管理",
    "layout.menuAdminThreatIntel": "脅威インテリジェンスを公開",
    "layout.menuAuditLog": "監査ログ",
    "layout.menuComplianceScorecard": "コンプライアンススコアカード",
    "layout.menuDsrTracker": "DSR トラッカー",
  },
  ko: {
    "layout.groupGlobal": "글로벌 인텔리전스",
    "layout.groupResources": "리소스",
    "layout.groupCyberOps": "사이버 운영",
    "layout.signInPrompt": "계속하려면 로그인하세요",
    "layout.signOutTitle": "DJAC에서 로그아웃하시겠습니까?",
    "layout.signOutDesc": "로그아웃 후 수행할 작업을 선택하세요.",
    "layout.signInAgain": "다시 로그인",
    "layout.signInAgainDesc": "로그인 페이지로 돌아가기",
    "layout.registerNew": "새 계정 등록",
    "layout.registerNewDesc": "새 DJAC 계정 만들기",
    "layout.switchAccount": "계정 전환",
    "layout.switchAccountDesc": "다른 사용자로 로그인",
    "layout.menuOrgSettings": "조직 설정",
    "layout.menuAdminServiceRequests": "서비스 요청 관리",
    "layout.menuAdminThreatIntel": "위협 인텔리전스 게시",
    "layout.menuAuditLog": "감사 로그",
    "layout.menuComplianceScorecard": "규정 준수 스코어카드",
    "layout.menuDsrTracker": "DSR 추적기",
  },
  pt: {
    "layout.groupGlobal": "Inteligência global",
    "layout.groupResources": "Recursos",
    "layout.groupCyberOps": "Operações cibernéticas",
    "layout.signInPrompt": "Inicie sessão para continuar",
    "layout.signOutTitle": "Terminar sessão no DJAC?",
    "layout.signOutDesc": "Escolha o que fazer após terminar a sessão.",
    "layout.signInAgain": "Iniciar sessão novamente",
    "layout.signInAgainDesc": "Voltar à página de início de sessão",
    "layout.registerNew": "Registar uma nova conta",
    "layout.registerNewDesc": "Criar uma nova conta DJAC",
    "layout.switchAccount": "Mudar de conta",
    "layout.switchAccountDesc": "Iniciar sessão como outro utilizador",
    "layout.menuOrgSettings": "Configurações da organização",
    "layout.menuAdminServiceRequests": "Gerir pedidos de serviço",
    "layout.menuAdminThreatIntel": "Publicar inteligência de ameaças",
    "layout.menuAuditLog": "Registo de auditoria",
    "layout.menuComplianceScorecard": "Painel de conformidade",
    "layout.menuDsrTracker": "Rastreador de DSR",
  },
};
