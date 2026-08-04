import type { TinoCardData } from "../types";

export const MOCK_CARDS: TinoCardData[] = [
  {
    id: "mock-1",
    criadoEm: "2026-07-29T08:12:00",
    duracao: "1:47",
    tom: "urgente",
    ideiaCentral:
      "O cliente quer aprovar o contrato hoje, mas só se o desconto de 15% for confirmado por escrito antes do meio-dia.",
    acoes: [
      "Confirmar o desconto de 15% por e-mail antes das 12h",
      "Reenviar a minuta do contrato com a cláusula de pagamento revisada",
      "Agendar 15 min com o financeiro para validar a margem",
    ],
    evitar: [
      "Prometer o desconto verbalmente sem alinhar com o financeiro",
      "Deixar para responder à tarde — ele disse 'hoje' três vezes",
    ],
    surpreendente:
      "Ele disse que 'o preço é o único problema', mas mencionou de passagem que o prazo de entrega 'também precisa encaixar'. Isso é uma segunda objeção não declarada — se você resolver só o desconto, o negócio pode travar no prazo.",
    respostaDirecta:
      "Fechado. Confirmo o desconto de 15% por e-mail até 12h e já te mando a minuta revisada.",
    respostaPolida:
      "Oi! Recebi seu áudio — vou validar o desconto de 15% com o financeiro e te confirmo por escrito ainda antes do meio-dia, combinado?",
  },
  {
    id: "mock-2",
    criadoEm: "2026-07-28T19:40:00",
    duracao: "0:58",
    tom: "cobranca_leve",
    ideiaCentral:
      "Sua irmã está perguntando (pela terceira vez) se você vai confirmar presença no aniversário do seu pai e se pode ajudar com o bolo.",
    acoes: [
      "Confirmar presença no grupo da família",
      "Responder se vai levar o bolo ou não",
    ],
    evitar: [
      "Ignorar de novo — ela já perguntou nos últimos dois áudios",
    ],
    surpreendente:
      "O tom começou leve, mas ela repetiu 'só pra eu me organizar' duas vezes. Isso costuma aparecer quando alguém já está montando um plano B na sua ausência — ela pode estar cobrindo você caso não apareça.",
    respostaDirecta: "Confirmado, vou sim! Levo o bolo, pode deixar.",
    respostaPolida:
      "Oi! Desculpa a demora — pode confirmar minha presença sim, e eu cuido do bolo 💛",
  },
  {
    id: "mock-3",
    criadoEm: "2026-07-28T11:05:00",
    duracao: "3:21",
    tom: "ideia",
    ideiaCentral:
      "Ideia para o próximo lançamento: criar um plano anual com 2 meses grátis, testando primeiro com a lista de espera antes de abrir pro público.",
    acoes: [
      "Desenhar a página do plano anual com o desconto",
      "Separar a lista de espera em um grupo de teste fechado",
      "Definir a métrica de sucesso do teste antes de lançar",
    ],
    evitar: [
      "Abrir para todo mundo direto sem validar com o grupo fechado primeiro",
    ],
    surpreendente:
      "A ideia assume que a lista de espera converte igual ao público frio, mas você mesmo disse em outro áudio que essa lista 'nunca foi qualificada direito'. Vale validar isso antes de basear o lançamento nela.",
    respostaDirecta:
      "Vou estruturar o plano anual e testar primeiro com a lista de espera antes do lançamento geral.",
    respostaPolida:
      "Adorei a ideia do plano anual — bora validar com um grupo fechado primeiro pra garantir que a lista de espera responde bem?",
  },
];

// Resultados usados para simular um novo cartão sempre que o usuário grava um áudio.
// Ficam em rotação para mostrar os 4 tons possíveis, incluindo "informativo".
export const SIMULATED_RESULTS: Omit<TinoCardData, "id" | "criadoEm">[] = [
  {
    duracao: "2:03",
    tom: "informativo",
    ideiaCentral:
      "A reunião com o time de produto foi remarcada para quinta às 10h, e o roadmap do trimestre já foi compartilhado no Drive.",
    acoes: [
      "Bloquear quinta às 10h na agenda",
      "Ler o roadmap antes da reunião",
    ],
    evitar: ["Chegar sem ter visto o roadmap — ele pediu comentários por escrito antes"],
    surpreendente:
      "Ele mencionou 'só pra alinhar antes de comunicar pro time todo' — isso sugere que essa reunião é uma pré-decisão, não uma discussão aberta. Se você discordar de algo, esse é o único momento com espaço real pra mudar.",
    respostaDirecta: "Beleza, bloqueei quinta às 10h e já vou ler o roadmap antes.",
    respostaPolida: "Perfeito, já ajustei minha agenda para quinta às 10h. Vou revisar o roadmap com calma antes da reunião.",
  },
  {
    duracao: "1:12",
    tom: "urgente",
    ideiaCentral:
      "O servidor caiu de novo às 6h e o time de infra precisa de aprovação sua para fazer o rollback agora.",
    acoes: [
      "Aprovar o rollback no canal de incidentes",
      "Avisar o time de suporte sobre a instabilidade",
    ],
    evitar: ["Esperar a reunião das 9h pra decidir — o rollback é urgente"],
    surpreendente:
      "Ele disse 'é a segunda vez essa semana' — isso é um padrão, não um incidente isolado. Aprovar o rollback resolve agora, mas não resolve a causa raiz que já apareceu duas vezes.",
    respostaDirecta: "Aprovado, pode fazer o rollback agora.",
    respostaPolida: "Oi, aprovo o rollback imediatamente. Depois vamos entender por que isso já é a segunda vez essa semana.",
  },
  {
    duracao: "0:41",
    tom: "cobranca_leve",
    ideiaCentral:
      "Seu amigo quer saber se o combinado de sexta ainda está de pé, porque já reservou a mesa no restaurante.",
    acoes: ["Confirmar presença na sexta", "Avisar se vai mais alguém"],
    evitar: ["Deixar ele sem resposta — a mesa já está reservada em nome dele"],
    surpreendente:
      "Ele disse 'já reservei', o que muda a situação: cancelar agora tem custo social pra ele, não só pra você. Uma resposta rápida evita que ele fique numa posição chata com o restaurante.",
    respostaDirecta: "Confirmado! Vou sim na sexta.",
    respostaPolida: "Oi! Continua de pé sim, te vejo lá 🙌",
  },
];
