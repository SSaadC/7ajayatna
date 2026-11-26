// ==========================================================================
//  7AJAYATNA (حجاياتنا) – BASE DE DONNÉES DES DEVINETTES TRADITIONNELLES
//  Conforme au Cahier des Charges INPT (3 Niveaux, Variantes, Contexte Culturel)
// ==========================================================================

const LEVELS_DATA = [
  {
    id: 1,
    title: "Niveau 1 : Sahla (Facile)",
    subtitle: "Les incontournables de nos grands-mères",
    darijaTitle: "المستوى الأول : ساهلة",
    badge: "Niveau 1",
    color: "#2A9D8F", // Émeraude / Menthe
    unlockScore: 0,
    timePerQuestion: 30,
    requiredToUnlockNext: 40,
    description: "Devinettes populaires et familières, idéales pour se familiariser avec l'esprit des 7ajayat.",
    questions: [
      {
        id: "l1_q1",
        darija: "3ndou snan w ma kay3ddch, chkoun houwa ?",
        arabic: "عندو سنان وما كيعضش، شكون هو؟",
        french: "« Il a des dents mais ne mord jamais. Qui est-ce ? »",
        solution: "lmchet",
        displayAnswer: "Lmchet (Le peigne / المشط)",
        category: "Objets du quotidien",
        region: "Toutes régions",
        variants: [
          "lmchet", "mchet", "lmechta", "mechta", "el mchet", "el mechta",
          "peigne", "le peigne", "un peigne",
          "المشط", "مشط", "المشطة", "مشطة"
        ],
        hint: "On l'utilise le matin pour prendre soin de ses cheveux.",
        explanation: "Le peigne traditionnel marocain (souvent en bois de bruyère ou en corne dans les souks de Fès). Ses picots sont appelés métaphoriquement des 'dents' (snan).",
        distractors: ["L'menchar (La scie)", "L'ferchita (La fourchette)", "L'ferracha (La brosse)"]
      },
      {
        id: "l1_q2",
        darija: "Tawil w ma 3ndou dhar, chkoun houwa ?",
        arabic: "طويل وما عندو ضهر، شكون هو؟",
        french: "« Il est tout en longueur mais n'a pas de dos. Qui est-ce ? »",
        solution: "triq",
        displayAnswer: "Triq (La route, le chemin / الطريق)",
        category: "Espace & Voyage",
        region: "Souss & Haouz",
        variants: [
          "triq", "ltriq", "eltriq", "et-triq", "attariq", "tariq",
          "route", "la route", "chemin", "le chemin", "une route",
          "طريق", "الطريق"
        ],
        hint: "On y marche chaque jour pour se déplacer d'une ville à une autre.",
        explanation: "La route (Triq). Métaphore ancienne des caravanes et des voyageurs reliant les oasis aux cités impériales.",
        distractors: ["L'wad (La rivière)", "L'7bel (La corde)", "L'af3a (Le serpent)"]
      },
      {
        id: "l1_q3",
        darija: "Khadra f jbelha, 7amra f souqha, k7la f darha. Chnou hiya ?",
        arabic: "خضرة ف جبلها، حمرة ف سوقها، كحلة ف دارها. شنو هي؟",
        french: "« Verte sur sa montagne, rouge au marché, noire à la maison. Qui est-elle ? »",
        solution: "l7enna",
        displayAnswer: "L7enna (Le henné / الحناء)",
        category: "Traditions & Fêtes",
        region: "Zagora & Tazzarine",
        variants: [
          "l7enna", "henna", "el henna", "l henna", "l7ena", "henné", "le henne", "le henné",
          "حناء", "الحناء", "الحنة", "حنة"
        ],
        hint: "Plante bénie ornant les mains des mariées lors des célébrations traditionnelles.",
        explanation: "Le henné : feuilles vertes sur la plante, poudre rougeâtre vendue au souk des épices, et devient très foncée (tirant sur le noir) une fois posée et séchée sur la peau.",
        distractors: ["L'9ahwa (Le café)", "Maticha (La tomate)", "Atay (Le thé)"]
      },
      {
        id: "l1_q4",
        darija: "Kteb bla 9lam w ymchi bla rjlin, chkoun houwa ?",
        arabic: "كتب بلا قلم ويمشي بلا رجلين، شكون هو؟",
        french: "« Il écrit sans plume et avance sans jambes. Qui est-ce ? »",
        solution: "lber9",
        displayAnswer: "Lber9 (L'éclair / البرق)",
        category: "Nature & Ciel",
        region: "Moyen Atlas",
        variants: [
          "lber9", "ber9", "el berq", "lbar9", "eclair", "l'eclair", "l eclair", "la foudre",
          "البرق", "برق", "سحاب", "s7ab"
        ],
        hint: "Il illumine brutalement le ciel avant que le tonnerre ne gronde.",
        explanation: "L'éclair (Lber9) qui sillonne le ciel en traçant des zébrures lumineuses instantanées lors des orages.",
        distractors: ["Rri7 (Le vent)", "L'9mar (La lune)", "L'ma (L'eau de pluie)"]
      },
      {
        id: "l1_q5",
        darija: "Terkeb 3lih w ma 3ndou rjlin, w kaywesslek fin ma bghiti. Chnou houwa ?",
        arabic: "تركب عليه وما عندو رجلين، و كيوصلك فين ما بغيتي. شنو هو؟",
        french: "« Tu le chausses sans qu'il ait de pattes, et il t'emmène où tu veux. Qui est-ce ? »",
        solution: "lbelgha",
        displayAnswer: "Lbelgha (La babouche / البلغة)",
        category: "Habits traditionnels",
        region: "Fès & Marrakech",
        variants: [
          "lbelgha", "belgha", "el belgha", "babouche", "la babouche", "les babouches",
          "البلغة", "بلغة", "شربيل", "cherbil"
        ],
        hint: "Chaussure emblématique marocaine en cuir jaune pour les hommes ou brodée pour les femmes.",
        explanation: "La fameuse Belgha marocaine, fabriquée à la main par les maîtres artisans (maâllems) des tanneries de Fès et de Marrakech.",
        distractors: ["L'baskla (Le vélo)", "Zzerbiya (Le tapis)", "L'3awd (Le cheval)"]
      }
    ]
  },
  {
    id: 2,
    title: "Niveau 2 : Mtwassat (Intermédiaire)",
    subtitle: "L'art de la métaphore et de l'observation",
    darijaTitle: "المستوى الثاني : متوسط",
    badge: "Niveau 2",
    color: "#E76F51", // Terre cuite / Terracotta
    unlockScore: 60,
    timePerQuestion: 25,
    requiredToUnlockNext: 140,
    description: "Des devinettes plus imagées qui demandent de regarder les objets du quotidien sous un nouvel angle.",
    questions: [
      {
        id: "l2_q1",
        darija: "Kbir w maytqal, sghir w maythrrek, dima tab3ek w ma t9edch tchddou. Chkoun houwa ?",
        arabic: "كبير وما يثقال، صغير وما يتحرك، ديما تابعك وما تقدرش تشدو. شكون هو؟",
        french: "« Immense sans peser un gramme, il te suit partout sans que tu puisses l'attraper. Qui est-ce ? »",
        solution: "kheyal",
        displayAnswer: "Kheyal (L'ombre / الخيال - الظل)",
        category: "Phénomènes naturels",
        region: "Région de Rabat-Salé",
        variants: [
          "kheyal", "lkheyal", "kheyyal", "kheial", "dell", "ldell", "dill",
          "ombre", "l'ombre", "l ombre", "mon ombre",
          "خيال", "الخيال", "ظل", "الظل"
        ],
        hint: "Elle grandit au coucher du soleil et disparaît dans l'obscurité totale.",
        explanation: "L'ombre (Kheyal ou Dell). Thème récurrent dans la poésie populaire marocaine sur la fidélité et l'évanescence.",
        distractors: ["Rri7 (Le vent)", "L'hawa (L'air)", "S-s7ab (Le nuage)"]
      },
      {
        id: "l2_q2",
        darija: "Dar 7amra, skanha 3bid, w saret-ha 7did. Chnou hiya ?",
        arabic: "دار حمرة، سكانها عبيد، وسوارتها حديد. شنو هي؟",
        french: "« Maison rouge, ses habitants sont noirs et sa clé est d'acier. Qui est-elle ? »",
        solution: "della7a",
        displayAnswer: "Della7a (La pastèque / الدلاحة)",
        category: "Terroir & Fruits",
        region: "Gharb & Doukkala",
        variants: [
          "della7a", "della7", "dela7", "dela7a", "dellaha", "pasteque", "la pasteque", "une pasteque",
          "الدلاحة", "دلاحة", "الدلاح", "دلاح"
        ],
        hint: "Le fruit roi de l'été au Maroc, rafraîchissant, plein de pépins noirs et tranché avec un couteau.",
        explanation: "La pastèque (Della7a) : la chair rouge ('dar 7amra'), les pépins noirs ('skanha 3bid') et le couteau d'acier pour l'ouvrir ('saret-ha 7did').",
        distractors: ["Remmana (La grenade)", "Maticha (La tomate)", "L'ber9ou9 (La prune)"]
      },
      {
        id: "l2_q3",
        darija: "Yemchi bla rjlin, ydkhul bla bab, w ybki bla 3inin. Chkoune houwa ?",
        arabic: "يمشي بلا رجلين، يدخل بلا باب، ويبكي بلا عينين. شكون هو؟",
        french: "« Il avance sans pieds, entre sans porte et pleure sans yeux. Qui est-ce ? »",
        solution: "s7ab",
        displayAnswer: "S-s7ab (Le nuage et la pluie / السحاب والشتاء)",
        category: "Éléments & Saisons",
        region: "Chaouia",
        variants: [
          "s7ab", "ss7ab", "s-s7ab", "chta", "shta", "lghim", "nuage", "le nuage", "la pluie", "les nuages",
          "سحاب", "السحاب", "الغيم", "الشتاء"
        ],
        hint: "Il s'amoncelle au ciel avant d'arroser les champs d'oliviers et de blé.",
        explanation: "Le nuage porteur de pluie (S-s7ab). Dans la culture agraire marocaine, la pluie est appelée 'L-Gheyt' (la miséricorde céleste).",
        distractors: ["L'wad (La rivière)", "Rri7 (Le vent)", "L'bir (Le puits)"]
      },
      {
        id: "l2_q4",
        darija: "Sme3tha bla wednin, w chftha bla 3inin, w tkellmat bla lssan. Chnou hiya ?",
        arabic: "سمعتها بلا ودنين، وشفتها بلا عينين، وتكلمات بلا لسان. شنو هي؟",
        french: "« On l'entend sans oreilles, on la perçoit sans yeux, elle parle sans langue. Qui est-ce ? »",
        solution: "rissala",
        displayAnswer: "Rissala / L-Barqiya (La lettre, le message / الرسالة)",
        category: "Savoir & Écrit",
        region: "Fès & Meknès",
        variants: [
          "rissala", "lrissala", "barqia", "lbarqiya", "lettre", "la lettre", "le message", "message",
          "رسالة", "الرسالة", "برقية", "البرقية"
        ],
        hint: "Écrite sur du papier, scellée, elle voyageait jadis avec les messagers (Raqqas).",
        explanation: "La lettre (Rissala) ou télégramme (Barqiya). Le facteur traditionnel (L-Raqqas) traversait tout le Maroc à pied pour porter les missives.",
        distractors: ["L'mraya (Le miroir)", "L'kamanja (Le violon)", "L'mejmar (Le brasero)"]
      },
      {
        id: "l2_q5",
        darija: "Kheddam bel-lil w n-nhar, ma 3mrou 3ya w ma 3mrou kla l-khobz. Chnou houwa ?",
        arabic: "خدام بالليل والنهار، ما عمرو عيا وما عمرو كلا الخبز. شنو هو؟",
        french: "« Il travaille nuit et jour, ne se fatigue jamais et ne mange jamais de pain. Qui est-ce ? »",
        solution: "l9elb",
        displayAnswer: "L9elb (Le cœur / القلب)",
        category: "Corps & Vie",
        region: "Tanger & Nord",
        variants: [
          "l9elb", "qelb", "el qelb", "lqalb", "coeur", "le coeur", "le cœur",
          "قلب", "القلب"
        ],
        hint: "Il bat dans ta poitrine au rythme de tes émotions.",
        explanation: "Le cœur (L-Qelb). Moteur inlassable de la vie humaine depuis la naissance jusqu'au dernier souffle.",
        distractors: ["L'moukh (Le cerveau)", "L'megana (L'horloge)", "L'wad (Le cours d'eau)"]
      }
    ]
  },
  {
    id: 3,
    title: "Niveau 3 : S3iba (Expert & Patrimoine)",
    subtitle: "Les énigmes poétiques des conteurs de Jamaâ El Fna",
    darijaTitle: "المستوى الثالث : صعيبة وعريقة",
    badge: "Niveau 3",
    color: "#E9C46A", // Or & Ambre impérial
    unlockScore: 140,
    timePerQuestion: 20,
    requiredToUnlockNext: 999,
    description: "Devinettes poétiques anciennes de la tradition orale (7lay9iya), énigmatiques et riches en symboles.",
    questions: [
      {
        id: "l3_q1",
        darija: "7ajitek ma jitek : 9addou 9add l-fara, w sawtou yhzz l-3mara. Chkoun houwa ?",
        arabic: "حجيتك ما جيتك : قدو قد الفارة، وصوتو يهز العمارة. شكون هو؟",
        french: "« Hajitek ma jitek : Pas plus gros qu'une souris, mais sa voix fait trembler toute l'assemblée. Qui est-ce ? »",
        solution: "l9ortasa",
        displayAnswer: "L9ortasa (La cartouche de Tbourida / الرصاصة أو البارود)",
        category: "Tradition & Tbourida",
        region: "Abda & Taza",
        variants: [
          "l9ortasa", "qortasa", "kartoucha", "lbaroud", "baroud", "cartouche", "la balle", "balle", "projectile",
          "رصاصة", "الرصاصة", "البارود", "بارود", "قرطاسة", "القرطاسة"
        ],
        hint: "Lié à la Fantasia (Tbourida) et à la poudre noire détonante tirée par les cavaliers en chœur.",
        explanation: "La cartouche de poudre (L-Qortasa / L-Baroud) utilisée lors des charges majestueuses de Tbourida, fleuron du patrimoine marocain.",
        distractors: ["S-sfar (Le sifflet)", "L'ghita (L'instrument à vent)", "L'ferrache (Le pétard)"]
      },
      {
        id: "l3_q2",
        darija: "7ajitek 3la li tkebbou fih yzid, w tne99ess mennou yzid. Chnou hiya ?",
        arabic: "حجيتك على اللي تكبو فيه يزيد، وتنقص منو يزيد. شنو هي؟",
        french: "« Plus tu lui retires de la matière, plus elle grandit. Qui est-elle ? »",
        solution: "l7ofra",
        displayAnswer: "L7ofra (Le trou, la fosse / الحفرة)",
        category: "Paradoxes populaires",
        region: "Marrakech & Haouz",
        variants: [
          "l7ofra", "hofra", "7ofra", "el hofra", "trou", "le trou", "une fosse", "la fosse",
          "حفرة", "الحفرة"
        ],
        hint: "Quand on retire de la terre du sol à la pelle, elle s'élargit.",
        explanation: "Le trou (L-7ofra). Un classique des jeux de logique dans les veillées de contes marocains : creuser l'agrandit.",
        distractors: ["L'bir (Le puits)", "L'khebya (La jarre)", "Zzaytouna (L'olivier)"]
      },
      {
        id: "l3_q3",
        darija: "7ajitek 3la chejra f wast d-dar, wra9ha f-semma w jdoura f-nnar. Chnou hiya ?",
        arabic: "حجيتك على شجرة ف وسط الدار، وراقها ف السما وجدورها ف النار. شنو هي؟",
        french: "« Une silhouette au cœur de la demeure : son faîte touche le ciel et ses racines plongent dans le feu. Qui est-ce ? »",
        solution: "ddokhan",
        displayAnswer: "Ddokhan (La fumée du Mejmar / الدخان)",
        category: "Foyer & Rituel",
        region: "Oujda & Oriental",
        variants: [
          "ddokhan", "dokhan", "dekhan", "doukhan", "fumee", "la fumee", "la fumée",
          "دخان", "الدخان"
        ],
        hint: "Elle s'élève au-dessus du brasero (Mejmar) quand brûlent les braises de charbon ou l'encens.",
        explanation: "La fumée (D-Dokhan) émanant du Kanoun ou du brasero : sa source plonge dans les braises ardentes, et sa volute monte vers le ciel.",
        distractors: ["L'3afya (La flamme)", "L'bkhour (L'encens)", "L'berrad (La théière)"]
      },
      {
        id: "l3_q4",
        darija: "Seb3a f seb3a w koul seb3a fiha seb3a, w ma ykhrej menha ghir wa7ed. Chnou houwa ?",
        arabic: "سبعة ف سبعة وكل سبعة فيها سبعة، وما يخرج منها غير واحد. شنو هو؟",
        french: "« Sept par sept et dans chaque sept il y a sept, et il n'en sort qu'un seul. Qu'est-ce que c'est ? »",
        solution: "kousksou",
        displayAnswer: "Kousksou / L-Gherbal (Le tamis et le couscous / الغربال والكسكس)",
        category: "Art culinaire marocain",
        region: "Fès & Doukkala",
        variants: [
          "kousksou", "couscous", "seksou", "gherbal", "lgherbal", "le couscous", "le tamis",
          "كسكس", "الكسكس", "سكسو", "غربال", "الغربال"
        ],
        hint: "Le plat emblématique du vendredi, passé traditionnellement au tamis (Gherbal).",
        explanation: "Le grain de couscous roulé et tamisé à travers le Gherbal aux mailles calibrées, rituel millénaire des foyers marocains.",
        distractors: ["L'khobz (Le pain)", "L'baghrir (Les crêpes)", "Atay (Le thé)"]
      },
      {
        id: "l3_q5",
        darija: "Bayda ki l-7lib, w safya ki l-ma, ila 9sstiha tatmout w ila khllitiha t3ich. Chnou hiya ?",
        arabic: "بيضا كي الحليب، وصافية كي الما، إلا قستيها كتموت وإلا خليتيها كتعيش. شنو هي؟",
        french: "« Blanche comme le lait, claire comme l'eau, si tu la touches elle meurt, si tu la laisses elle vit. Qui est-elle ? »",
        solution: "tebra",
        displayAnswer: "Tebra / N-nada (La rosée du matin ou la neige / الندى أو الثلج)",
        category: "Nature & Pureté",
        region: "Haut Atlas",
        variants: [
          "tebra", "nada", "n-nada", "telj", "thelj", "rosee", "la rosee", "la rosée", "neige", "la neige",
          "ندى", "الندى", "ثلج", "الثلج"
        ],
        hint: "Gouttelettes scintillantes au lever du jour ou flocon immaculé sur les cimes de l'Atlas.",
        explanation: "La rosée (N-nada) ou la neige immaculée : à la moindre chaleur de la main, elle fond instantanément pour redevenir eau.",
        distractors: ["L'bid (L'œuf)", "Z-zit (L'huile)", "L'feggou3 (Le champignon)"]
      }
    ]
  }
];

// Helper to get level by ID
function getLevelById(lvlId) {
  return LEVELS_DATA.find(l => l.id === Number(lvlId)) || LEVELS_DATA[0];
}
