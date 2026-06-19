# Modelagem e regras de negócio

## Impostos cobrado de empresas no Brasil

- Os impostos cobrados de empresas no Brasil variam de acordo com o Regime Tributário escolhido (Simples Nacional, Lucro Presumido ou Lucro Real) e a atividade da empresa (comércio, indústria ou serviços).Eles são divididos entre as esferas Federal, Estadual e Municipal.

- A principal diferença entre os regimes tributários está na forma de apuração dos impostos: o Simples Nacional unifica o pagamento em uma única guia simplificada baseada no faturamento, o Lucro Presumido estima o lucro do negócio com base em tabelas da Receita Federal, e o Lucro Real calcula os tributos exatamente sobre o lucro líquido da empresa.

1. Simples Nacional: É um regime facilitado para Microempresas (ME) e Empresas de Pequeno Porte (EPP), ideal para quem está começando.Como funciona: Unifica até 8 impostos (federais, estaduais e municipais) em uma única guia mensal de arrecadação, o DAS.Limite de faturamento: Até R$ 4,8 milhões por ano.Vantagens: Menos burocracia, alíquotas iniciais mais baixas (especialmente para comércio e indústria) e dispensa de algumas obrigações acessórias complexas.Desvantagens: Em setores com alta lucratividade, a alíquota pode subir rapidamente e encarecer o imposto. Não permite o aproveitamento de créditos tributários.

3. Lucro PresumidoÉ um regime onde a Receita Federal presume que a empresa tem uma margem de lucro padrão, independente do que ocorreu no caixa.Como funciona: Os impostos (IRPJ e CSLL) são calculados aplicando uma porcentagem padrão sobre o faturamento. Por exemplo, 8% para comércio e indústria, e 32% para a maioria dos serviços.Limite de faturamento: Até R$ 78 milhões por ano.Vantagens: Excelente para empresas que possuem margem de lucro real maior do que a presumida pela lei, pois pagam impostos sobre um valor menor. A carga tributária é previsível e tem menos burocracia do que o Lucro Real.Desvantagens: Se a empresa der prejuízo ou tiver lucro muito baixo, os impostos continuam sendo cobrados sobre a margem presumida. Não gera créditos para PIS e COFINS.Para detalhes sobre as alíquotas de presunção por atividade específica:Regras Lucro Presumido - FlashLucro RealÉ o regime geral de tributação. A apuração é baseada no lucro líquido real da empresa, ou seja, receita menos as despesas dedutíveis.Como funciona: O cálculo é feito subtraindo os custos e despesas operacionais da receita. Se houver lucro, incidem os impostos. Se houver prejuízo, a empresa não paga IRPJ e CSLL.Limite de faturamento: É obrigatório para empresas com faturamento acima de R$ 78 milhões, ou para setores específicos como bancos, empresas de factoring, etc. Mas qualquer empresa pode optar por ele.Vantagens: É o modelo mais justo: se a empresa não lucra, não paga imposto sobre o lucro. Permite também um amplo uso de créditos tributários (como PIS/COFINS), reduzindo o custo para empresas com muitas despesas operacionais.Desvantagens: Exige contabilidade rígida e detalhada, além do cumprimento de diversas obrigações acessórias (como ECD e ECF). Um erro na contabilidade pode gerar pesadas multas.

1. `Impostos Federais (Incidentes sobre o Faturamento ou Lucro)` Estes impostos são recolhidos pela Receita Federal e aplicam-se a praticamente todas as empresas:

    - `IRPJ (Imposto de Renda Pessoa Jurídica):` Incide diretamente sobre o lucro da empresa (no Lucro Real/Presumido) ou de forma unificada sobre o faturamento (no Simples Nacional).

    - `CSLL (Contribuição Social sobre o Lucro Líquido):` Destinada ao financiamento da Seguridade Social, também acompanha a base de cálculo do IRPJ.

    - `PIS (Programa de Integração Social):` Contribuição mensal sobre o faturamento para custear o seguro-desemprego e abonos de trabalhadores.

    - `COFINS (Contribuição para o Financiamento da Seguridade Social):` Incide sobre o faturamento bruto e financia a saúde pública e previdência.

    - `IPI (Imposto sobre Produtos Industrializados):` Cobrado apenas de indústrias ou empresas que importam mercadorias, incidindo no momento em que o produto sai da fábrica.

2. `Impostos Estaduais (Incidentes sobre a Circulação)`

    - Recolhidos pelas Secretarias de Fazenda (SEFAZ) de cada estado, fundamentais para empresas de comércio (PDV):ICMS (Imposto sobre Circulação de Mercadorias e Serviços): É o imposto mais importante para o comércio varejista. Aplica-se à movimentação de mercadorias, serviços de transporte intermunicipal/interestadual e de comunicação. No PDV, ele pode ser cobrado na venda ou já vir retido anteriormente via ICMS-ST (Substituição Tributária).

3. `Impostos Municipais (Incidentes sobre Serviços e Imóveis)`

    - Recolhidos pelas Prefeituras onde o estabelecimento ou o serviço é prestado:ISS ou ISSQN (Imposto Sobre Serviços de Qualquer Natureza): Incide sobre a prestação de serviços (médicos, mecânicos, consultorias, desenvolvimento de software). A alíquota varia entre 2% e 5% dependendo da cidade e do serviço.

4. `Como esses impostos funcionam nos Regimes Tributários`

    Para o sistema de PDV e retaguarda que você está desenvolvendo, a forma como esses impostos aparecem no banco de dados muda completamente dependendo do enquadramento do seu Tenant:

    - `Simples Nacional:` Cria uma guia única (DAS) onde todos os impostos acima (exceto casos específicos de substituição tributária) são unificados em uma única alíquota baseada na faixa de faturamento. No cupom fiscal (NFC-e), o sistema utiliza códigos CSOSN (Ex: 102 - Tributada sem permissão de crédito).

    - `Lucro Presumido / Lucro Real:` Os impostos são calculados e pagos de forma separada através de guias individuais (DARF e GARE). No cupom fiscal, o sistema utiliza códigos CST (Ex: 00 - Tributada integralmente) e discrimina a alíquota exata de ICMS, PIS e COFINS de cada produto.

`OBS:`Para que o seu motor de cálculo fiscal funcione corretamente no backend, o próximo passo ideal é estruturar como o sistema vai identificar o regime do lojista.Se você quiser avançar, me informe:Queremos criar a tabela de Regras Fiscais por Estado (Matriz Tributária) para o Lucro Presumido, ou prefere focar primeiro no cálculo unificado para clientes do Simples Nacional?

Estes quatro códigos formam a base da classificação fiscal no Brasil. Eles determinam o que é o produto, qual a operação realizada e como os impostos devem ser calculados.

Aqui está o resumo prático de cada um:

NCM (Nomenclatura Comum do Mercosul): O "RG" do produto. É um código de 8 dígitos que padroniza a mercadoria internacionalmente, servindo para definir as alíquotas de importação, IPI e o tratamento tributário. Consulte a Tabela NCM no Portal Único Siscomex.

CFOP (Código Fiscal de Operações e Prestações): Identifica o tipo de operação (ex: se é uma venda, devolução, brinde, dentro ou fora do estado). Exemplos: 5102 (venda dentro do estado) ou 6102 (venda para outro estado).

CST (Código de Situação Tributária): Usado por empresas do Regime Normal (Lucro Real ou Presumido). Define como a mercadoria é tributada (ex: tributada integralmente, com substituição tributária ou isenta).

CSOSN (Código de Situação da Operação no Simples Nacional): É o substituto do CST para empresas optantes pelo Simples Nacional. Exemplos: 101 (tributada com permissão de crédito) ou 500 (ICMS cobrado anteriormente por substituição tributária).

Para entender melhor, a relação é simples:

- O NCM diz o que você está vendendo.

- O CFOP diz o que está sendo feito com a mercadoria (ex: venda, remessa).

- O CST/CSOSN diz como o imposto (ICMS) incidirá nessa operação.

`OBS:`Se precisar de ajuda com a tributação, para que eu possa indicar o código correto para o seu caso, por favor me diga:

- O seu produto principal ou o serviço prestado.

- Se a sua empresa é do Simples Nacional ou do Regime Normal.

- Se a operação é uma venda, compra ou devolução.


## Novas funcionalidades

- crie a página de administração para o cliente com roles de acesso, admin, caixa, estoquista. O Admin poderá cadastrar tudo,o caixa poderá acessar cadastrar categorias, produtos, funcionários, faça essa implementação através do ítens do menu gerencial

- Me auxilie para colocar esse sistema na aws, preciso criar as variáveis e as secrets e implementar o
  terraform para ci/cd

- Baseado no design_system/templates/admin-multitenant/AdminMultitenant.dc.html, modifique a página de admin-multitenant, e implemente as mudanças no projeto local com o Next.js.