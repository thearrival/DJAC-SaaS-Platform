import type { AppLocale } from "./localeTypes";

/**
 * Onboarding & personalized-workspace UI strings.
 *
 * All text in the onboarding flow uses stable keys resolved through this map
 * (LANGUAGE NEVER CHANGES THE UNDERLYING PROFILE — keys are stable ids). `en`
 * is the authored source; the other eight locales are best-effort translations
 * and should be reviewed by native speakers before being treated as final.
 */
export const ONBOARDING_STRINGS: Partial<
  Record<AppLocale, Record<string, string>>
> = {
  en: {
    "onboarding.step": "Step",
    "onboarding.back": "Back",
    "onboarding.continue": "Continue",
    "onboarding.skip": "Skip for now",
    "onboarding.error.required": "Please choose an option.",
    "onboarding.error.save": "We couldn't save that answer. Please try again.",
    "onboarding.error.finish": "We couldn't finish setup. Please try again.",
    "onboarding.ready.title": "Your workspace is ready.",
    "onboarding.ready.body": "We've configured DJAC around your priorities.",
    "onboarding.ready.cta": "Enter My Workspace",
    "onboarding.ready.explore": "Explore DJAC",
    "onboarding.empty": "Nothing to set up right now.",
    "onboarding.prompt.title": "Finish setting up your workspace",
    "onboarding.prompt.body":
      "Answer a few quick questions and we'll organize DJAC around your priorities.",
    "onboarding.prompt.cta": "Get started",
    "workspace.title": "Your personalized workspace",
    "workspace.nextStep": "Your next step",
    "workspace.recommended": "Recommended for you",
    "workspace.personalize": "Personalize my workspace",
    "workspace.personalized": "Personalized",
    "workspace.dismiss": "Dismiss",
    "workspace.dismissOne": "Dismiss recommendation",
  },

  ar: {
    "onboarding.step": "الخطوة",
    "onboarding.back": "رجوع",
    "onboarding.continue": "متابعة",
    "onboarding.skip": "تخطٍ الآن",
    "onboarding.error.required": "يرجى اختيار أحد الخيارات.",
    "onboarding.error.save": "تعذّر حفظ الإجابة. يرجى المحاولة مرة أخرى.",
    "onboarding.error.finish": "تعذّر إكمال الإعداد. يرجى المحاولة مرة أخرى.",
    "onboarding.ready.title": "مساحة عملك جاهزة.",
    "onboarding.ready.body": "قمنا بإعداد DJAC وفقًا لأولوياتك.",
    "onboarding.ready.cta": "الدخول إلى مساحة العمل",
    "onboarding.ready.explore": "استكشف DJAC",
    "onboarding.empty": "لا يوجد ما يجب إعداده الآن.",
    "onboarding.prompt.title": "أكمل إعداد مساحة عملك",
    "onboarding.prompt.body":
      "أجب عن بضعة أسئلة سريعة وسننظّم DJAC وفقًا لأولوياتك.",
    "onboarding.prompt.cta": "ابدأ الآن",
    "workspace.title": "مساحة عملك المخصّصة",
    "workspace.nextStep": "خطوتك التالية",
    "workspace.recommended": "مقترح لك",
    "workspace.personalize": "تخصيص مساحة عملي",
    "workspace.personalized": "مخصّص",
    "workspace.dismiss": "إغلاق",
    "workspace.dismissOne": "إغلاق التوصية",
  },

  zh: {
    "onboarding.step": "步骤",
    "onboarding.back": "返回",
    "onboarding.continue": "继续",
    "onboarding.skip": "暂时跳过",
    "onboarding.error.required": "请选择一个选项。",
    "onboarding.error.save": "无法保存该回答，请重试。",
    "onboarding.error.finish": "无法完成设置，请重试。",
    "onboarding.ready.title": "你的工作区已就绪。",
    "onboarding.ready.body": "我们已根据你的优先事项配置好 DJAC。",
    "onboarding.ready.cta": "进入我的工作区",
    "onboarding.ready.explore": "探索 DJAC",
    "onboarding.empty": "目前无需设置。",
    "onboarding.prompt.title": "完成工作区设置",
    "onboarding.prompt.body":
      "回答几个简单问题，我们将根据你的优先事项组织 DJAC。",
    "onboarding.prompt.cta": "开始",
    "workspace.title": "你的个性化工作区",
    "workspace.nextStep": "你的下一步",
    "workspace.recommended": "为你推荐",
    "workspace.personalize": "个性化我的工作区",
    "workspace.personalized": "已个性化",
    "workspace.dismiss": "关闭",
    "workspace.dismissOne": "关闭推荐",
  },

  fr: {
    "onboarding.step": "Étape",
    "onboarding.back": "Retour",
    "onboarding.continue": "Continuer",
    "onboarding.skip": "Ignorer pour l'instant",
    "onboarding.error.required": "Veuillez choisir une option.",
    "onboarding.error.save":
      "Impossible d'enregistrer cette réponse. Réessayez.",
    "onboarding.error.finish":
      "Impossible de terminer la configuration. Réessayez.",
    "onboarding.ready.title": "Votre espace de travail est prêt.",
    "onboarding.ready.body": "Nous avons configuré DJAC selon vos priorités.",
    "onboarding.ready.cta": "Accéder à mon espace",
    "onboarding.ready.explore": "Explorer DJAC",
    "onboarding.empty": "Rien à configurer pour le moment.",
    "onboarding.prompt.title": "Terminez la configuration de votre espace",
    "onboarding.prompt.body":
      "Répondez à quelques questions et nous organiserons DJAC selon vos priorités.",
    "onboarding.prompt.cta": "Commencer",
    "workspace.title": "Votre espace personnalisé",
    "workspace.nextStep": "Votre prochaine étape",
    "workspace.recommended": "Recommandé pour vous",
    "workspace.personalize": "Personnaliser mon espace",
    "workspace.personalized": "Personnalisé",
    "workspace.dismiss": "Fermer",
    "workspace.dismissOne": "Fermer la recommandation",
  },

  es: {
    "onboarding.step": "Paso",
    "onboarding.back": "Atrás",
    "onboarding.continue": "Continuar",
    "onboarding.skip": "Omitir por ahora",
    "onboarding.error.required": "Elige una opción.",
    "onboarding.error.save":
      "No pudimos guardar esa respuesta. Inténtalo de nuevo.",
    "onboarding.error.finish":
      "No pudimos finalizar la configuración. Inténtalo de nuevo.",
    "onboarding.ready.title": "Tu espacio de trabajo está listo.",
    "onboarding.ready.body": "Hemos configurado DJAC según tus prioridades.",
    "onboarding.ready.cta": "Entrar en mi espacio",
    "onboarding.ready.explore": "Explorar DJAC",
    "onboarding.empty": "Nada que configurar por ahora.",
    "onboarding.prompt.title": "Termina de configurar tu espacio",
    "onboarding.prompt.body":
      "Responde unas preguntas y organizaremos DJAC según tus prioridades.",
    "onboarding.prompt.cta": "Comenzar",
    "workspace.title": "Tu espacio personalizado",
    "workspace.nextStep": "Tu próximo paso",
    "workspace.recommended": "Recomendado para ti",
    "workspace.personalize": "Personalizar mi espacio",
    "workspace.personalized": "Personalizado",
    "workspace.dismiss": "Descartar",
    "workspace.dismissOne": "Descartar recomendación",
  },

  de: {
    "onboarding.step": "Schritt",
    "onboarding.back": "Zurück",
    "onboarding.continue": "Weiter",
    "onboarding.skip": "Vorerst überspringen",
    "onboarding.error.required": "Bitte wähle eine Option.",
    "onboarding.error.save":
      "Diese Antwort konnte nicht gespeichert werden. Bitte erneut versuchen.",
    "onboarding.error.finish":
      "Die Einrichtung konnte nicht abgeschlossen werden. Bitte erneut versuchen.",
    "onboarding.ready.title": "Dein Arbeitsbereich ist bereit.",
    "onboarding.ready.body": "Wir haben DJAC auf deine Prioritäten abgestimmt.",
    "onboarding.ready.cta": "Arbeitsbereich öffnen",
    "onboarding.ready.explore": "DJAC erkunden",
    "onboarding.empty": "Derzeit nichts einzurichten.",
    "onboarding.prompt.title": "Einrichtung abschließen",
    "onboarding.prompt.body":
      "Beantworte ein paar Fragen und wir richten DJAC nach deinen Prioritäten ein.",
    "onboarding.prompt.cta": "Loslegen",
    "workspace.title": "Dein personalisierter Arbeitsbereich",
    "workspace.nextStep": "Dein nächster Schritt",
    "workspace.recommended": "Für dich empfohlen",
    "workspace.personalize": "Arbeitsbereich personalisieren",
    "workspace.personalized": "Personalisiert",
    "workspace.dismiss": "Ausblenden",
    "workspace.dismissOne": "Empfehlung ausblenden",
  },

  ja: {
    "onboarding.step": "ステップ",
    "onboarding.back": "戻る",
    "onboarding.continue": "続ける",
    "onboarding.skip": "後でスキップ",
    "onboarding.error.required": "オプションを選択してください。",
    "onboarding.error.save":
      "回答を保存できませんでした。もう一度お試しください。",
    "onboarding.error.finish":
      "セットアップを完了できませんでした。もう一度お試しください。",
    "onboarding.ready.title": "ワークスペースの準備ができました。",
    "onboarding.ready.body": "優先事項に合わせて DJAC を設定しました。",
    "onboarding.ready.cta": "ワークスペースを開く",
    "onboarding.ready.explore": "DJAC を見る",
    "onboarding.empty": "現在設定する項目はありません。",
    "onboarding.prompt.title": "ワークスペースの設定を完了する",
    "onboarding.prompt.body":
      "いくつかの質問に答えると、優先事項に合わせて DJAC を整理します。",
    "onboarding.prompt.cta": "開始",
    "workspace.title": "パーソナライズされたワークスペース",
    "workspace.nextStep": "次のステップ",
    "workspace.recommended": "おすすめ",
    "workspace.personalize": "ワークスペースをカスタマイズ",
    "workspace.personalized": "パーソナライズ済み",
    "workspace.dismiss": "閉じる",
    "workspace.dismissOne": "おすすめを閉じる",
  },

  ko: {
    "onboarding.step": "단계",
    "onboarding.back": "뒤로",
    "onboarding.continue": "계속",
    "onboarding.skip": "나중에 건너뛰기",
    "onboarding.error.required": "옵션을 선택하세요.",
    "onboarding.error.save": "답변을 저장하지 못했습니다. 다시 시도하세요.",
    "onboarding.error.finish": "설정을 완료하지 못했습니다. 다시 시도하세요.",
    "onboarding.ready.title": "워크스페이스가 준비되었습니다.",
    "onboarding.ready.body": "우선순위에 맞게 DJAC을 구성했습니다.",
    "onboarding.ready.cta": "워크스페이스 열기",
    "onboarding.ready.explore": "DJAC 둘러보기",
    "onboarding.empty": "지금 설정할 항목이 없습니다.",
    "onboarding.prompt.title": "워크스페이스 설정 완료",
    "onboarding.prompt.body":
      "몇 가지 질문에 답하면 우선순위에 맞게 DJAC을 구성해 드립니다.",
    "onboarding.prompt.cta": "시작하기",
    "workspace.title": "개인화된 워크스페이스",
    "workspace.nextStep": "다음 단계",
    "workspace.recommended": "추천 항목",
    "workspace.personalize": "워크스페이스 개인화",
    "workspace.personalized": "개인화됨",
    "workspace.dismiss": "닫기",
    "workspace.dismissOne": "추천 닫기",
  },

  pt: {
    "onboarding.step": "Etapa",
    "onboarding.back": "Voltar",
    "onboarding.continue": "Continuar",
    "onboarding.skip": "Ignorar por enquanto",
    "onboarding.error.required": "Escolha uma opção.",
    "onboarding.error.save":
      "Não foi possível salvar essa resposta. Tente novamente.",
    "onboarding.error.finish":
      "Não foi possível concluir a configuração. Tente novamente.",
    "onboarding.ready.title": "Seu espaço de trabalho está pronto.",
    "onboarding.ready.body":
      "Configuramos o DJAC de acordo com suas prioridades.",
    "onboarding.ready.cta": "Entrar no meu espaço",
    "onboarding.ready.explore": "Explorar o DJAC",
    "onboarding.empty": "Nada para configurar agora.",
    "onboarding.prompt.title": "Conclua a configuração do seu espaço",
    "onboarding.prompt.body":
      "Responda a algumas perguntas e organizaremos o DJAC conforme suas prioridades.",
    "onboarding.prompt.cta": "Começar",
    "workspace.title": "Seu espaço personalizado",
    "workspace.nextStep": "Seu próximo passo",
    "workspace.recommended": "Recomendado para você",
    "workspace.personalize": "Personalizar meu espaço",
    "workspace.personalized": "Personalizado",
    "workspace.dismiss": "Dispensar",
    "workspace.dismissOne": "Dispensar recomendação",
  },
};
