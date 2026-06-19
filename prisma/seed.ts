import { prisma } from "../src/lib/db.js";
import { ensureCredentialUser } from "../src/lib/credential-user.js";
import { DEFAULT_TENANT_ID, DEFAULT_TENANT_SLUG, ensureTenant } from "../src/lib/tenant.js";
import type { Category } from "../src/generated/prisma/client.js";

interface SeedUserInput {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "MANAGER" | "CASHIER" | "STOCKIST";
}

interface SeedProductInput {
  sku: string;
  barcode: string;
  name: string;
  description: string;
  unit: "UNIT" | "KG";
  priceInCents: number;
  costInCents: number;
  stockQuantity: number;
  minimumStock: number;
  fiscalNcm: string;
  fiscalCfop: string;
  categoryPath?: string[];
}

interface SeedProductCatalogOverride {
  name: string;
  description: string;
  imageUrl: string;
}

const adminSeedUser: SeedUserInput = {
  name: "Administrador PDV",
  email: "admin@pdv.local",
  password: "ChangeMe123!",
  role: "ADMIN",
};

const managerSeedUser: SeedUserInput = {
  name: "Gerente Loja",
  email: "gerente@pdv.local",
  password: "Gerente123!",
  role: "MANAGER",
};

const cashierSeedUser: SeedUserInput = {
  name: "Caixa Operador",
  email: "caixa@pdv.local",
  password: "Caixa123!",
  role: "CASHIER",
};

const stockistSeedUser: SeedUserInput = {
  name: "Estoquista Loja",
  email: "estoque@pdv.local",
  password: "Estoque123!",
  role: "STOCKIST",
};

const users: SeedUserInput[] = [
  adminSeedUser,
  managerSeedUser,
  cashierSeedUser,
  stockistSeedUser,
];

const products: SeedProductInput[] = [
  {
    sku: "SKU-ARROZ-5KG",
    barcode: "7891000000011",
    name: "Arroz Tipo 1 5kg",
    description: "Arroz branco tipo 1 pacote 5kg",
    unit: "UNIT",
    priceInCents: 2890,
    costInCents: 2140,
    stockQuantity: 42,
    minimumStock: 10,
    fiscalNcm: "10063021",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Basicos", "Graos", "Arroz", "Tipo 1"],
  },
  {
    sku: "SKU-FEIJAO-1KG",
    barcode: "7891000000028",
    name: "Feijão Carioca 1kg",
    description: "Feijão carioca pacote 1kg",
    unit: "UNIT",
    priceInCents: 899,
    costInCents: 610,
    stockQuantity: 58,
    minimumStock: 15,
    fiscalNcm: "07133319",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Basicos", "Graos", "Feijao"],
  },
  {
    sku: "SKU-CAFE-500G",
    barcode: "7891000000035",
    name: "Café Tradicional 500g",
    description: "Café torrado e moído 500g",
    unit: "UNIT",
    priceInCents: 1790,
    costInCents: 1190,
    stockQuantity: 27,
    minimumStock: 8,
    fiscalNcm: "09012100",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Bebidas", "Cafe"],
  },
  {
    sku: "SKU-LEITE-1L",
    barcode: "7891000000042",
    name: "Leite Integral 1L",
    description: "Leite UHT integral caixa 1L",
    unit: "UNIT",
    priceInCents: 549,
    costInCents: 390,
    stockQuantity: 96,
    minimumStock: 24,
    fiscalNcm: "04012010",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Bebidas", "Lacteos"],
  },
  {
    sku: "SKU-BANANA-KG",
    barcode: "2200000000017",
    name: "Banana Prata kg",
    description: "Produto pesado em balança",
    unit: "KG",
    priceInCents: 699,
    costInCents: 420,
    stockQuantity: 33.5,
    minimumStock: 5,
    fiscalNcm: "08039000",
    fiscalCfop: "5102",
    categoryPath: ["Hortifruti", "Frutas"],
  },
  {
    sku: "SKU-DETERGENTE-500ML",
    barcode: "7891000000059",
    name: "Detergente Neutro 500ml",
    description: "Detergente líquido neutro 500ml",
    unit: "UNIT",
    priceInCents: 299,
    costInCents: 165,
    stockQuantity: 120,
    minimumStock: 20,
    fiscalNcm: "34025000",
    fiscalCfop: "5102",
    categoryPath: ["Limpeza", "Cozinha"],
  },
  {
    sku: "SKU-ACUCAR-1KG",
    barcode: "7891000000073",
    name: "Açúcar Refinado 1kg",
    description: "Açúcar refinado especial pacote 1kg",
    unit: "UNIT",
    priceInCents: 489,
    costInCents: 320,
    stockQuantity: 64,
    minimumStock: 15,
    fiscalNcm: "17019900",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Basicos", "Acucar e Adocantes"],
  },
  {
    sku: "SKU-SAL-1KG",
    barcode: "7891000000080",
    name: "Sal Refinado 1kg",
    description: "Sal refinado iodado pacote 1kg",
    unit: "UNIT",
    priceInCents: 259,
    costInCents: 140,
    stockQuantity: 80,
    minimumStock: 20,
    fiscalNcm: "25010020",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Basicos", "Temperos"],
  },
  {
    sku: "SKU-OLEO-SOJA-900ML",
    barcode: "7891000000097",
    name: "Óleo de Soja 900ml",
    description: "Óleo de soja refinado garrafa 900ml",
    unit: "UNIT",
    priceInCents: 749,
    costInCents: 520,
    stockQuantity: 48,
    minimumStock: 12,
    fiscalNcm: "15071000",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Basicos", "Oleos e Azeites"],
  },
  {
    sku: "SKU-MACARRAO-500G",
    barcode: "7891000000103",
    name: "Macarrão Espaguete 500g",
    description: "Macarrão espaguete com ovos 500g",
    unit: "UNIT",
    priceInCents: 459,
    costInCents: 290,
    stockQuantity: 70,
    minimumStock: 18,
    fiscalNcm: "19021900",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Basicos", "Massas"],
  },
  {
    sku: "SKU-MOLHO-TOMATE-340G",
    barcode: "7891000000110",
    name: "Molho de Tomate 340g",
    description: "Molho de tomate tradicional sachê 340g",
    unit: "UNIT",
    priceInCents: 329,
    costInCents: 190,
    stockQuantity: 90,
    minimumStock: 20,
    fiscalNcm: "21032010",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Basicos", "Enlatados e Conservas"],
  },
  {
    sku: "SKU-BISCOITO-RECHEADO-130G",
    barcode: "7891000000127",
    name: "Biscoito Recheado Chocolate 130g",
    description: "Biscoito recheado sabor chocolate 130g",
    unit: "UNIT",
    priceInCents: 279,
    costInCents: 150,
    stockQuantity: 110,
    minimumStock: 25,
    fiscalNcm: "19053100",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Doces e Snacks", "Biscoitos"],
  },
  {
    sku: "SKU-REFRIGERANTE-2L",
    barcode: "7891000000134",
    name: "Refrigerante Cola 2L",
    description: "Refrigerante sabor cola garrafa 2L",
    unit: "UNIT",
    priceInCents: 899,
    costInCents: 560,
    stockQuantity: 75,
    minimumStock: 20,
    fiscalNcm: "22021000",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Bebidas", "Refrigerantes"],
  },
  {
    sku: "SKU-AGUA-MINERAL-1500ML",
    barcode: "7891000000141",
    name: "Água Mineral sem Gás 1,5L",
    description: "Água mineral natural sem gás 1,5L",
    unit: "UNIT",
    priceInCents: 299,
    costInCents: 150,
    stockQuantity: 130,
    minimumStock: 30,
    fiscalNcm: "22011000",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Bebidas", "Aguas"],
  },
  {
    sku: "SKU-SUCO-UVA-1L",
    barcode: "7891000000158",
    name: "Suco de Uva Integral 1L",
    description: "Suco de uva integral sem adição de açúcar 1L",
    unit: "UNIT",
    priceInCents: 1290,
    costInCents: 820,
    stockQuantity: 36,
    minimumStock: 10,
    fiscalNcm: "20096100",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Bebidas", "Sucos"],
  },
  {
    sku: "SKU-MANTEIGA-200G",
    barcode: "7891000000165",
    name: "Manteiga com Sal 200g",
    description: "Manteiga extra com sal pote 200g",
    unit: "UNIT",
    priceInCents: 1190,
    costInCents: 800,
    stockQuantity: 40,
    minimumStock: 10,
    fiscalNcm: "04051000",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Bebidas", "Lacteos"],
  },
  {
    sku: "SKU-OVOS-DUZIA",
    barcode: "7891000000172",
    name: "Ovos Brancos Dúzia",
    description: "Ovos de galinha brancos cartela com 12 unidades",
    unit: "UNIT",
    priceInCents: 1090,
    costInCents: 720,
    stockQuantity: 55,
    minimumStock: 12,
    fiscalNcm: "04072100",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Basicos", "Ovos"],
  },
  {
    sku: "SKU-TOMATE-KG",
    barcode: "2200000000024",
    name: "Tomate kg",
    description: "Tomate maduro vendido por quilo na balança",
    unit: "KG",
    priceInCents: 799,
    costInCents: 480,
    stockQuantity: 28.5,
    minimumStock: 5,
    fiscalNcm: "07020000",
    fiscalCfop: "5102",
    categoryPath: ["Hortifruti", "Legumes"],
  },
  {
    sku: "SKU-MACA-KG",
    barcode: "2200000000031",
    name: "Maçã Gala kg",
    description: "Maçã gala vendida por quilo na balança",
    unit: "KG",
    priceInCents: 999,
    costInCents: 620,
    stockQuantity: 22.0,
    minimumStock: 5,
    fiscalNcm: "08081000",
    fiscalCfop: "5102",
    categoryPath: ["Hortifruti", "Frutas"],
  },
  {
    sku: "SKU-BATATA-KG",
    barcode: "2200000000048",
    name: "Batata Inglesa kg",
    description: "Batata inglesa lavada vendida por quilo na balança",
    unit: "KG",
    priceInCents: 599,
    costInCents: 350,
    stockQuantity: 45.0,
    minimumStock: 8,
    fiscalNcm: "07019000",
    fiscalCfop: "5102",
    categoryPath: ["Hortifruti", "Legumes"],
  },
  {
    sku: "SKU-PAO-FRANCES-KG",
    barcode: "2200000000055",
    name: "Pão Francês kg",
    description: "Pão francês fresco vendido por quilo",
    unit: "KG",
    priceInCents: 1490,
    costInCents: 820,
    stockQuantity: 12.0,
    minimumStock: 3,
    fiscalNcm: "19059090",
    fiscalCfop: "5102",
    categoryPath: ["Padaria", "Paes"],
  },
  {
    sku: "SKU-SABAO-PO-1KG",
    barcode: "7891000000189",
    name: "Sabão em Pó 1kg",
    description: "Sabão em pó para roupas caixa 1kg",
    unit: "UNIT",
    priceInCents: 1390,
    costInCents: 890,
    stockQuantity: 60,
    minimumStock: 15,
    fiscalNcm: "34022000",
    fiscalCfop: "5102",
    categoryPath: ["Limpeza", "Roupas"],
  },
  {
    sku: "SKU-PAPEL-HIGIENICO-12",
    barcode: "7891000000196",
    name: "Papel Higiênico 12 rolos",
    description: "Papel higiênico folha dupla pacote 12 rolos",
    unit: "UNIT",
    priceInCents: 1890,
    costInCents: 1240,
    stockQuantity: 50,
    minimumStock: 12,
    fiscalNcm: "48181000",
    fiscalCfop: "5102",
    categoryPath: ["Higiene", "Cuidados Pessoais"],
  },
  {
    sku: "SKU-SABONETE-90G",
    barcode: "7891000000202",
    name: "Sabonete Hidratante 90g",
    description: "Sabonete em barra hidratante 90g",
    unit: "UNIT",
    priceInCents: 249,
    costInCents: 130,
    stockQuantity: 140,
    minimumStock: 30,
    fiscalNcm: "34011190",
    fiscalCfop: "5102",
    categoryPath: ["Higiene", "Cuidados Pessoais"],
  },
  {
    sku: "SKU-FARINHA-TRIGO-1KG",
    barcode: "7891000000219",
    name: "Farinha de Trigo 1kg",
    description: "Farinha de trigo especial para bolos, paes e massas.",
    unit: "UNIT",
    priceInCents: 569,
    costInCents: 360,
    stockQuantity: 72,
    minimumStock: 18,
    fiscalNcm: "11010010",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Basicos", "Farinhas"],
  },
  {
    sku: "SKU-FUBA-1KG",
    barcode: "7891000000226",
    name: "Fuba Mimoso 1kg",
    description: "Fuba mimoso para bolos e receitas tradicionais.",
    unit: "UNIT",
    priceInCents: 429,
    costInCents: 250,
    stockQuantity: 55,
    minimumStock: 12,
    fiscalNcm: "11022000",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Basicos", "Farinhas"],
  },
  {
    sku: "SKU-MILHO-VERDE-170G",
    barcode: "7891000000233",
    name: "Milho Verde em Conserva 170g",
    description: "Milho verde em conserva lata 170g.",
    unit: "UNIT",
    priceInCents: 379,
    costInCents: 220,
    stockQuantity: 90,
    minimumStock: 20,
    fiscalNcm: "20058000",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Basicos", "Enlatados e Conservas"],
  },
  {
    sku: "SKU-ERVILHA-200G",
    barcode: "7891000000240",
    name: "Ervilha em Conserva 200g",
    description: "Ervilha em conserva lata 200g.",
    unit: "UNIT",
    priceInCents: 349,
    costInCents: 210,
    stockQuantity: 84,
    minimumStock: 18,
    fiscalNcm: "20054000",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Basicos", "Enlatados e Conservas"],
  },
  {
    sku: "SKU-ATUM-170G",
    barcode: "7891000000257",
    name: "Atum Ralado em Oleo 170g",
    description: "Atum ralado em oleo, lata 170g.",
    unit: "UNIT",
    priceInCents: 949,
    costInCents: 620,
    stockQuantity: 46,
    minimumStock: 10,
    fiscalNcm: "16041410",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Basicos", "Enlatados e Conservas"],
  },
  {
    sku: "SKU-SARDINHA-125G",
    barcode: "7891000000264",
    name: "Sardinha em Molho de Tomate 125g",
    description: "Sardinha em molho de tomate, lata 125g.",
    unit: "UNIT",
    priceInCents: 629,
    costInCents: 410,
    stockQuantity: 65,
    minimumStock: 15,
    fiscalNcm: "16041310",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Basicos", "Enlatados e Conservas"],
  },
  {
    sku: "SKU-MAIONESE-500G",
    barcode: "7891000000271",
    name: "Maionese Tradicional 500g",
    description: "Maionese tradicional pote 500g.",
    unit: "UNIT",
    priceInCents: 799,
    costInCents: 520,
    stockQuantity: 48,
    minimumStock: 12,
    fiscalNcm: "21039011",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Basicos", "Condimentos"],
  },
  {
    sku: "SKU-KETCHUP-400G",
    barcode: "7891000000288",
    name: "Ketchup Tradicional 400g",
    description: "Ketchup tradicional frasco 400g.",
    unit: "UNIT",
    priceInCents: 689,
    costInCents: 430,
    stockQuantity: 52,
    minimumStock: 12,
    fiscalNcm: "21032010",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Basicos", "Condimentos"],
  },
  {
    sku: "SKU-MOSTARDA-200G",
    barcode: "7891000000295",
    name: "Mostarda Tradicional 200g",
    description: "Mostarda tradicional frasco 200g.",
    unit: "UNIT",
    priceInCents: 459,
    costInCents: 280,
    stockQuantity: 58,
    minimumStock: 14,
    fiscalNcm: "21033010",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Basicos", "Condimentos"],
  },
  {
    sku: "SKU-ACHOCOLATADO-400G",
    barcode: "7891000000301",
    name: "Achocolatado em Po 400g",
    description: "Achocolatado em po instantaneo 400g.",
    unit: "UNIT",
    priceInCents: 899,
    costInCents: 590,
    stockQuantity: 44,
    minimumStock: 10,
    fiscalNcm: "18069000",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Bebidas", "Achocolatados"],
  },
  {
    sku: "SKU-CHOCOLATE-BARRA-90G",
    barcode: "7891000000318",
    name: "Chocolate ao Leite Barra 90g",
    description: "Chocolate ao leite barra 90g.",
    unit: "UNIT",
    priceInCents: 529,
    costInCents: 330,
    stockQuantity: 88,
    minimumStock: 20,
    fiscalNcm: "18063210",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Doces e Snacks", "Chocolates"],
  },
  {
    sku: "SKU-IOGURTE-170G",
    barcode: "7891000000325",
    name: "Iogurte Morango 170g",
    description: "Iogurte sabor morango pote 170g.",
    unit: "UNIT",
    priceInCents: 359,
    costInCents: 220,
    stockQuantity: 76,
    minimumStock: 20,
    fiscalNcm: "04031000",
    fiscalCfop: "5102",
    categoryPath: ["Frios e Laticinios", "Laticinios"],
  },
  {
    sku: "SKU-QUEIJO-MUSSARELA-200G",
    barcode: "7891000000332",
    name: "Queijo Mussarela Fatiado 200g",
    description: "Queijo mussarela fatiado, bandeja 200g.",
    unit: "UNIT",
    priceInCents: 1390,
    costInCents: 950,
    stockQuantity: 38,
    minimumStock: 10,
    fiscalNcm: "04061010",
    fiscalCfop: "5102",
    categoryPath: ["Frios e Laticinios", "Frios"],
  },
  {
    sku: "SKU-PRESUNTO-200G",
    barcode: "7891000000349",
    name: "Presunto Cozido Fatiado 200g",
    description: "Presunto cozido fatiado, bandeja 200g.",
    unit: "UNIT",
    priceInCents: 1190,
    costInCents: 790,
    stockQuantity: 40,
    minimumStock: 10,
    fiscalNcm: "16024900",
    fiscalCfop: "5102",
    categoryPath: ["Frios e Laticinios", "Frios"],
  },
  {
    sku: "SKU-FRANGO-INTEIRO-KG",
    barcode: "2200000000062",
    name: "Frango Inteiro Resfriado KG",
    description: "Frango inteiro resfriado, venda por peso.",
    unit: "KG",
    priceInCents: 1299,
    costInCents: 870,
    stockQuantity: 18.5,
    minimumStock: 4,
    fiscalNcm: "02071200",
    fiscalCfop: "5102",
    categoryPath: ["Carnes", "Aves"],
  },
  {
    sku: "SKU-CARNE-MOIDA-KG",
    barcode: "2200000000079",
    name: "Carne Moida Bovina KG",
    description: "Carne moida bovina fresca, venda por peso.",
    unit: "KG",
    priceInCents: 3299,
    costInCents: 2490,
    stockQuantity: 14.2,
    minimumStock: 3,
    fiscalNcm: "02013000",
    fiscalCfop: "5102",
    categoryPath: ["Carnes", "Bovino"],
  },
  {
    sku: "SKU-DESINFETANTE-2L",
    barcode: "7891000000356",
    name: "Desinfetante Lavanda 2L",
    description: "Desinfetante perfumado lavanda frasco 2 litros.",
    unit: "UNIT",
    priceInCents: 899,
    costInCents: 560,
    stockQuantity: 62,
    minimumStock: 14,
    fiscalNcm: "38089419",
    fiscalCfop: "5102",
    categoryPath: ["Limpeza", "Casa"],
  },
  {
    sku: "SKU-AGUA-SANITARIA-1L",
    barcode: "7891000000363",
    name: "Agua Sanitaria 1L",
    description: "Agua sanitaria multiuso frasco 1 litro.",
    unit: "UNIT",
    priceInCents: 359,
    costInCents: 210,
    stockQuantity: 90,
    minimumStock: 20,
    fiscalNcm: "28289011",
    fiscalCfop: "5102",
    categoryPath: ["Limpeza", "Casa"],
  },
  {
    sku: "SKU-AMACIANTE-2L",
    barcode: "7891000000370",
    name: "Amaciante Concentrado 2L",
    description: "Amaciante concentrado para roupas frasco 2 litros.",
    unit: "UNIT",
    priceInCents: 1190,
    costInCents: 760,
    stockQuantity: 54,
    minimumStock: 12,
    fiscalNcm: "34029039",
    fiscalCfop: "5102",
    categoryPath: ["Limpeza", "Roupas"],
  },
  {
    sku: "SKU-SABAO-BARRA-5UN",
    barcode: "7891000000387",
    name: "Sabao em Barra 5 Unidades",
    description: "Sabao em barra glicerinado com 5 unidades.",
    unit: "UNIT",
    priceInCents: 849,
    costInCents: 510,
    stockQuantity: 68,
    minimumStock: 15,
    fiscalNcm: "34011900",
    fiscalCfop: "5102",
    categoryPath: ["Limpeza", "Cozinha"],
  },
  {
    sku: "SKU-ESPONJA-3UN",
    barcode: "7891000000394",
    name: "Esponja Multiuso 3 Unidades",
    description: "Esponja multiuso com manta abrasiva, pacote com 3.",
    unit: "UNIT",
    priceInCents: 499,
    costInCents: 290,
    stockQuantity: 95,
    minimumStock: 24,
    fiscalNcm: "39249000",
    fiscalCfop: "5102",
    categoryPath: ["Limpeza", "Cozinha"],
  },
  {
    sku: "SKU-PAPEL-TOALHA-2RL",
    barcode: "7891000000400",
    name: "Papel Toalha 2 Rolos",
    description: "Papel toalha folha dupla com 2 rolos.",
    unit: "UNIT",
    priceInCents: 699,
    costInCents: 420,
    stockQuantity: 70,
    minimumStock: 16,
    fiscalNcm: "48182000",
    fiscalCfop: "5102",
    categoryPath: ["Limpeza", "Cozinha"],
  },
  {
    sku: "SKU-SHAMPOO-350ML",
    barcode: "7891000000417",
    name: "Shampoo Hidratacao 350ml",
    description: "Shampoo hidratante uso diario frasco 350ml.",
    unit: "UNIT",
    priceInCents: 1290,
    costInCents: 830,
    stockQuantity: 48,
    minimumStock: 12,
    fiscalNcm: "33051000",
    fiscalCfop: "5102",
    categoryPath: ["Higiene", "Cuidados Pessoais"],
  },
  {
    sku: "SKU-CONDICIONADOR-350ML",
    barcode: "7891000000424",
    name: "Condicionador Hidratacao 350ml",
    description: "Condicionador hidratante uso diario frasco 350ml.",
    unit: "UNIT",
    priceInCents: 1290,
    costInCents: 820,
    stockQuantity: 45,
    minimumStock: 12,
    fiscalNcm: "33059000",
    fiscalCfop: "5102",
    categoryPath: ["Higiene", "Cuidados Pessoais"],
  },
  {
    sku: "SKU-ABSORVENTE-8UN",
    barcode: "7891000000431",
    name: "Absorvente Noturno com Abas 8 Unidades",
    description: "Absorvente noturno com abas pacote 8 unidades.",
    unit: "UNIT",
    priceInCents: 899,
    costInCents: 560,
    stockQuantity: 64,
    minimumStock: 14,
    fiscalNcm: "96190000",
    fiscalCfop: "5102",
    categoryPath: ["Higiene", "Cuidados Pessoais"],
  },
  {
    sku: "SKU-FRALDA-M-30UN",
    barcode: "7891000000448",
    name: "Fralda Descartavel Tamanho M 30 Unidades",
    description: "Fralda descartavel infantil tamanho M pacote com 30.",
    unit: "UNIT",
    priceInCents: 4390,
    costInCents: 3290,
    stockQuantity: 22,
    minimumStock: 6,
    fiscalNcm: "96190000",
    fiscalCfop: "5102",
    categoryPath: ["Higiene", "Infantil"],
  },
  {
    sku: "SKU-CERVEJA-LATA-350ML",
    barcode: "7891000000455",
    name: "Cerveja Pilsen Lata 350ml",
    description: "Cerveja pilsen tradicional lata 350ml.",
    unit: "UNIT",
    priceInCents: 399,
    costInCents: 250,
    stockQuantity: 180,
    minimumStock: 40,
    fiscalNcm: "22030000",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Bebidas", "Cervejas"],
  },
  {
    sku: "SKU-CERVEJA-LONG-NECK-330ML",
    barcode: "7891000000462",
    name: "Cerveja Long Neck 330ml",
    description: "Cerveja premium long neck 330ml.",
    unit: "UNIT",
    priceInCents: 599,
    costInCents: 390,
    stockQuantity: 120,
    minimumStock: 30,
    fiscalNcm: "22030000",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Bebidas", "Cervejas"],
  },
  {
    sku: "SKU-ENERGETICO-269ML",
    barcode: "7891000000479",
    name: "Energetico Lata 269ml",
    description: "Bebida energetica gaseificada lata 269ml.",
    unit: "UNIT",
    priceInCents: 899,
    costInCents: 620,
    stockQuantity: 74,
    minimumStock: 18,
    fiscalNcm: "22029900",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Bebidas", "Energeticos"],
  },
  {
    sku: "SKU-BISCOITO-AGUA-SAL-200G",
    barcode: "7891000000486",
    name: "Biscoito Agua e Sal 200g",
    description: "Biscoito agua e sal crocante pacote 200g.",
    unit: "UNIT",
    priceInCents: 439,
    costInCents: 260,
    stockQuantity: 96,
    minimumStock: 22,
    fiscalNcm: "19053100",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Doces e Snacks", "Biscoitos"],
  },
  {
    sku: "SKU-SUCO-LARANJA-1L",
    barcode: "7891000000493",
    name: "Suco de Laranja Integral 1L",
    description: "Suco integral de laranja sem adicao de acucar.",
    unit: "UNIT",
    priceInCents: 1190,
    costInCents: 780,
    stockQuantity: 40,
    minimumStock: 10,
    fiscalNcm: "20091900",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Bebidas", "Sucos"],
  },
  {
    sku: "SKU-REQUEIJAO-200G",
    barcode: "7891000000509",
    name: "Requeijao Cremoso 200g",
    description: "Requeijao cremoso tradicional copo 200g.",
    unit: "UNIT",
    priceInCents: 999,
    costInCents: 650,
    stockQuantity: 44,
    minimumStock: 10,
    fiscalNcm: "04061090",
    fiscalCfop: "5102",
    categoryPath: ["Frios e Laticinios", "Laticinios"],
  },
  {
    sku: "SKU-SEM-ESTOQUE",
    barcode: "7891000000066",
    name: "Produto Sem Estoque",
    description: "Item para demonstrar sinalização sem estoque",
    unit: "UNIT",
    priceInCents: 1599,
    costInCents: 900,
    stockQuantity: 0,
    minimumStock: 5,
    fiscalNcm: "19059090",
    fiscalCfop: "5102",
    categoryPath: ["Mercearia", "Basicos", "Demonstracao"],
  },
];

const productCatalogOverrides: Record<string, SeedProductCatalogOverride> = {
  "SKU-ARROZ-5KG": {
    name: "Arroz Camil Tipo 1 Pacote 5kg",
    description: "Arroz branco tipo 1 Camil, pacote economico 5kg.",
    imageUrl: "/img/produtos/sku-arroz-5kg.png",
  },
  "SKU-FEIJAO-1KG": {
    name: "Feijao Carioca Kicaldo Pacote 1kg",
    description: "Feijao carioca selecionado, graos inteiros, pacote 1kg.",
    imageUrl: "/img/produtos/sku-feijao-1kg.png",
  },
  "SKU-CAFE-500G": {
    name: "Cafe 3 Coracoes Tradicional 500g",
    description: "Cafe torrado e moido tradicional, pacote almofada 500g.",
    imageUrl: "/img/produtos/sku-cafe-500g.png",
  },
  "SKU-LEITE-1L": {
    name: "Leite Italac Integral UHT 1L",
    description: "Leite integral longa vida UHT, caixa 1 litro.",
    imageUrl: "/img/produtos/sku-leite-1l.png",
  },
  "SKU-BANANA-KG": {
    name: "Banana Prata Fresca KG",
    description: "Banana prata selecionada, venda por peso no caixa.",
    imageUrl: "/img/produtos/sku-banana-kg.png",
  },
  "SKU-DETERGENTE-500ML": {
    name: "Detergente Ype Neutro 500ml",
    description: "Detergente liquido neutro para loucas, frasco 500ml.",
    imageUrl: "/img/produtos/sku-detergente-500ml.png",
  },
  "SKU-ACUCAR-1KG": {
    name: "Acucar Uniao Refinado 1kg",
    description: "Acucar refinado especial para uso diario, pacote 1kg.",
    imageUrl: "/img/produtos/sku-acucar-1kg.png",
  },
  "SKU-SAL-1KG": {
    name: "Sal Cisne Refinado Iodado 1kg",
    description: "Sal refinado iodado para preparo de alimentos, pacote 1kg.",
    imageUrl: "/img/produtos/sku-sal-1kg.png",
  },
  "SKU-OLEO-SOJA-900ML": {
    name: "Oleo de Soja Liza 900ml",
    description: "Oleo de soja refinado, garrafa 900ml.",
    imageUrl: "/img/produtos/sku-oleo-soja-900ml.png",
  },
  "SKU-MACARRAO-500G": {
    name: "Macarrao Renata Espaguete 500g",
    description: "Massa de semola tipo espaguete, pacote 500g.",
    imageUrl: "/img/produtos/sku-macarrao-500g.png",
  },
  "SKU-MOLHO-TOMATE-340G": {
    name: "Molho de Tomate Quero Tradicional 340g",
    description: "Molho pronto tradicional, sache 340g.",
    imageUrl: "/img/produtos/sku-molho-tomate-340g.png",
  },
  "SKU-BISCOITO-RECHEADO-130G": {
    name: "Biscoito Passatempo Recheado Chocolate 130g",
    description: "Biscoito recheado sabor chocolate, pacote 130g.",
    imageUrl: "/img/produtos/sku-biscoito-recheado-130g.png",
  },
  "SKU-REFRIGERANTE-2L": {
    name: "Refrigerante Coca-Cola 2L",
    description: "Refrigerante sabor cola, garrafa pet 2 litros.",
    imageUrl: "/img/produtos/sku-refrigerante-2l.png",
  },
  "SKU-AGUA-MINERAL-1500ML": {
    name: "Agua Mineral Crystal sem Gas 1,5L",
    description: "Agua mineral natural sem gas, garrafa 1,5 litro.",
    imageUrl: "/img/produtos/sku-agua-mineral-1500ml.png",
  },
  "SKU-SUCO-UVA-1L": {
    name: "Suco Integral de Uva Aurora 1L",
    description: "Suco integral de uva, sem adicao de acucar, 1 litro.",
    imageUrl: "/img/produtos/sku-suco-uva-1l.png",
  },
  "SKU-MANTEIGA-200G": {
    name: "Manteiga Aviação com Sal 200g",
    description: "Manteiga com sal em pote, ideal para paes e receitas.",
    imageUrl: "/img/produtos/sku-manteiga-200g.png",
  },
  "SKU-OVOS-DUZIA": {
    name: "Ovos Brancos Grande Duzia",
    description: "Cartela com 12 ovos brancos selecionados.",
    imageUrl: "/img/produtos/sku-ovos-duzia.png",
  },
  "SKU-TOMATE-KG": {
    name: "Tomate Salada KG",
    description: "Tomate fresco para salada e preparo diario, venda por kg.",
    imageUrl: "/img/produtos/sku-tomate-kg.png",
  },
  "SKU-MACA-KG": {
    name: "Maca Gala KG",
    description: "Maca gala selecionada, venda por peso no caixa.",
    imageUrl: "/img/produtos/sku-maca-kg.png",
  },
  "SKU-BATATA-KG": {
    name: "Batata Inglesa KG",
    description: "Batata inglesa lavada para cozinhar e fritar, venda por kg.",
    imageUrl: "/img/produtos/sku-batata-kg.png",
  },
  "SKU-PAO-FRANCES-KG": {
    name: "Pao Frances Fresco KG",
    description: "Pao frances produzido no dia, venda por peso.",
    imageUrl: "/img/produtos/sku-pao-frances-kg.png",
  },
  "SKU-SABAO-PO-1KG": {
    name: "Sabao em Po OMO Lavagem Perfeita 1kg",
    description: "Sabao em po para roupas, caixa 1kg.",
    imageUrl: "/img/produtos/sku-sabao-po-1kg.png",
  },
  "SKU-PAPEL-HIGIENICO-12": {
    name: "Papel Higienico Neve Folha Dupla 12 Rolos",
    description: "Papel higienico folha dupla, pacote economico com 12 rolos.",
    imageUrl: "/img/produtos/sku-papel-higienico-12.png",
  },
  "SKU-SABONETE-90G": {
    name: "Sabonete Dove Hidratacao Intensa 90g",
    description: "Sabonete em barra para cuidado diario da pele, 90g.",
    imageUrl: "/img/produtos/sku-sabonete-90g.png",
  },
  "SKU-SEM-ESTOQUE": {
    name: "Arroz Raroz Pacote 1kg",
    description: "Produto para demonstracao de item sem estoque no PDV.",
    imageUrl: "/img/produtos/sku-sem-estoque.png",
  },
};

const seedProductImageFileName = (sku: string): string =>
  `${sku.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "")}.png`;

const resolveSeedProductImageUrl = (sku: string, preferredImageUrl?: string): string => {
  if (preferredImageUrl?.startsWith("/img/produtos/")) {
    return preferredImageUrl;
  }

  return `/img/produtos/${seedProductImageFileName(sku)}`;
};

const seedUsers = async () => {
  await ensureTenant({
    tenantId: DEFAULT_TENANT_ID,
    tenantSlug: DEFAULT_TENANT_SLUG,
    name: "Default Tenant",
  });

  const [admin, manager, cashier, stockist] = await Promise.all([
    ensureCredentialUser({
      ...adminSeedUser,
      tenantId: DEFAULT_TENANT_ID,
      tenantSlug: DEFAULT_TENANT_SLUG,
      tenantName: "Default Tenant",
    }),
    ensureCredentialUser({
      ...managerSeedUser,
      tenantId: DEFAULT_TENANT_ID,
      tenantSlug: DEFAULT_TENANT_SLUG,
      tenantName: "Default Tenant",
    }),
    ensureCredentialUser({
      ...cashierSeedUser,
      tenantId: DEFAULT_TENANT_ID,
      tenantSlug: DEFAULT_TENANT_SLUG,
      tenantName: "Default Tenant",
    }),
    ensureCredentialUser({
      ...stockistSeedUser,
      tenantId: DEFAULT_TENANT_ID,
      tenantSlug: DEFAULT_TENANT_SLUG,
      tenantName: "Default Tenant",
    }),
  ]);

  return {
    admin,
    manager,
    cashier,
    stockist,
  };
};

const ensureCategoryPath = async (path: string[], tenantId: string): Promise<Category> => {
  let parentId: string | null = null;
  let level = 1;
  let currentCategory: Category | null = null;

  for (const name of path) {
    const existingCategory: Category | null = await prisma.category.findFirst({
      where: {
        tenantId,
        parentId,
        name,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    currentCategory =
      existingCategory ??
      (await prisma.category.create({
        data: {
          tenantId,
          name,
          parentId,
          level,
        },
      }));

    if (!currentCategory) {
      throw new Error("Unable to create category hierarchy");
    }

    parentId = currentCategory.id;
    level += 1;
  }

  if (!currentCategory) {
    throw new Error("Unable to create category hierarchy");
  }

  return currentCategory;
};

const seedProducts = async () => {
  // Resolve os caminhos de categoria SEQUENCIALMENTE antes de criar os produtos.
  // ensureCategoryPath faz findFirst + create; rodá-lo concorrentemente (o
  // Promise.all abaixo) para caminhos que compartilham prefixos (ex.: varios
  // itens em "Mercearia/Basicos") criava categorias duplicadas — o indice
  // unique (parentId, name) nao protege raizes porque NULL != NULL no Postgres.
  const categoryByPath = new Map<string, Category>();

  for (const { categoryPath } of products) {
    if (!categoryPath) {
      continue;
    }

    const key = categoryPath.join(" / ");
    if (!categoryByPath.has(key)) {
      categoryByPath.set(key, await ensureCategoryPath(categoryPath, DEFAULT_TENANT_ID));
    }
  }

  return Promise.all(
    products.map(({ categoryPath, ...product }) => {
      const category = categoryPath
        ? categoryByPath.get(categoryPath.join(" / ")) ?? null
        : null;
      const productOverride = productCatalogOverrides[product.sku];
      const productPayload = {
        ...product,
        name: productOverride?.name ?? product.name,
        description: productOverride?.description ?? product.description,
        imageUrl: resolveSeedProductImageUrl(product.sku, productOverride?.imageUrl),
      };

      return prisma.product.upsert({
        where: {
          tenantId_sku: {
            tenantId: DEFAULT_TENANT_ID,
            sku: product.sku,
          },
        },
        update: {
          ...productPayload,
          categoryId: category?.id ?? null,
        },
        create: {
          tenantId: DEFAULT_TENANT_ID,
          ...productPayload,
          categoryId: category?.id ?? null,
        },
      });
    }),
  );
};

const seedCustomers = async () =>
  Promise.all([
    prisma.customer.upsert({
      where: {
        tenantId_cpf: {
          tenantId: DEFAULT_TENANT_ID,
          cpf: "12345678909",
        },
      },
      update: {
        name: "Maria Silva",
        phone: "11988887777",
        email: "maria.silva@example.com",
        loyaltyCode: "FID-MARIA-001",
        address: "Rua das Flores, 100 - Centro",
      },
      create: {
        tenantId: DEFAULT_TENANT_ID,
        name: "Maria Silva",
        cpf: "12345678909",
        phone: "11988887777",
        email: "maria.silva@example.com",
        loyaltyCode: "FID-MARIA-001",
        address: "Rua das Flores, 100 - Centro",
      },
    }),
    prisma.customer.upsert({
      where: {
        tenantId_cpf: {
          tenantId: DEFAULT_TENANT_ID,
          cpf: "98765432100",
        },
      },
      update: {
        name: "João Pereira",
        phone: "21977776666",
        email: "joao.pereira@example.com",
        loyaltyCode: "FID-JOAO-002",
        address: "Avenida Brasil, 455 - Loja 2",
      },
      create: {
        tenantId: DEFAULT_TENANT_ID,
        name: "João Pereira",
        cpf: "98765432100",
        phone: "21977776666",
        email: "joao.pereira@example.com",
        loyaltyCode: "FID-JOAO-002",
        address: "Avenida Brasil, 455 - Loja 2",
      },
    }),
    prisma.customer.upsert({
      where: {
        tenantId_cpf: {
          tenantId: DEFAULT_TENANT_ID,
          cpf: "45678912388",
        },
      },
      update: {
        name: "Cliente Delivery",
        phone: "31999998888",
        email: "delivery@example.com",
        loyaltyCode: "FID-DELIVERY-003",
        address: "Rua do Cliente, 321 - Apto 12",
      },
      create: {
        tenantId: DEFAULT_TENANT_ID,
        name: "Cliente Delivery",
        cpf: "45678912388",
        phone: "31999998888",
        email: "delivery@example.com",
        loyaltyCode: "FID-DELIVERY-003",
        address: "Rua do Cliente, 321 - Apto 12",
      },
    }),
  ]);

const seedCashRegister = async ({ cashierId }: { cashierId: string }) => {
  // Sessao historica ja fechada: o seed NAO deixa caixa aberto, para que
  // o modal de abertura ("Valor de entrada do caixa") apareca ao logar.
  const seedOpenedAt = new Date("2026-05-29T12:00:00.000Z");
  const seedClosedAt = new Date("2026-05-29T22:00:00.000Z");
  const cashSession = await prisma.cashRegisterSession.upsert({
    where: {
      id_tenantId: {
        id: "018f3ef0-1000-7000-9000-000000000001",
        tenantId: DEFAULT_TENANT_ID,
      },
    },
    update: {
      tenantId: DEFAULT_TENANT_ID,
      openedById: cashierId,
      closedById: cashierId,
      openingAmountInCents: 25000,
      status: "CLOSED",
      closingAmountInCents: 35000,
      expectedAmountInCents: 35000,
      profitInCents: 1502,
      openedAt: seedOpenedAt,
      closedAt: seedClosedAt,
    },
    create: {
      id: "018f3ef0-1000-7000-9000-000000000001",
      tenantId: DEFAULT_TENANT_ID,
      openedById: cashierId,
      closedById: cashierId,
      openingAmountInCents: 25000,
      status: "CLOSED",
      closingAmountInCents: 35000,
      expectedAmountInCents: 35000,
      profitInCents: 1502,
      openedAt: seedOpenedAt,
      closedAt: seedClosedAt,
    },
  });

  await prisma.cashMovement.upsert({
    where: {
      id_tenantId: {
        id: "018f3ef0-2000-7000-9000-000000000001",
        tenantId: DEFAULT_TENANT_ID,
      },
    },
    update: {
      tenantId: DEFAULT_TENANT_ID,
      cashSessionId: cashSession.id,
      operatorId: cashierId,
      type: "OPENING",
      amountInCents: 25000,
      note: "Abertura de caixa do seed",
    },
    create: {
      id: "018f3ef0-2000-7000-9000-000000000001",
      tenantId: DEFAULT_TENANT_ID,
      cashSessionId: cashSession.id,
      operatorId: cashierId,
      type: "OPENING",
      amountInCents: 25000,
      note: "Abertura de caixa do seed",
    },
  });

  await prisma.cashMovement.upsert({
    where: {
      id_tenantId: {
        id: "018f3ef0-2000-7000-9000-000000000002",
        tenantId: DEFAULT_TENANT_ID,
      },
    },
    update: {
      tenantId: DEFAULT_TENANT_ID,
      cashSessionId: cashSession.id,
      operatorId: cashierId,
      type: "SUPPLY",
      amountInCents: 10000,
      note: "Reforço para troco",
    },
    create: {
      id: "018f3ef0-2000-7000-9000-000000000002",
      tenantId: DEFAULT_TENANT_ID,
      cashSessionId: cashSession.id,
      operatorId: cashierId,
      type: "SUPPLY",
      amountInCents: 10000,
      note: "Reforço para troco",
    },
  });

  return cashSession;
};

const seedSale = async ({
  cashierId,
  cashSessionId,
  customerId,
}: {
  cashierId: string;
  cashSessionId: string;
  customerId: string;
}) => {
  const arroz = await prisma.product.findUniqueOrThrow({
    where: {
      tenantId_sku: {
        tenantId: DEFAULT_TENANT_ID,
        sku: "SKU-ARROZ-5KG",
      },
    },
  });
  const cafe = await prisma.product.findUniqueOrThrow({
    where: {
      tenantId_sku: {
        tenantId: DEFAULT_TENANT_ID,
        sku: "SKU-CAFE-500G",
      },
    },
  });
  const banana = await prisma.product.findUniqueOrThrow({
    where: {
      tenantId_sku: {
        tenantId: DEFAULT_TENANT_ID,
        sku: "SKU-BANANA-KG",
      },
    },
  });

  const sale = await prisma.sale.upsert({
    where: {
      tenantId_number: {
        tenantId: DEFAULT_TENANT_ID,
        number: "PDV-SEED-0001",
      },
    },
    update: {
      tenantId: DEFAULT_TENANT_ID,
      operatorId: cashierId,
      customerId,
      cashSessionId,
      status: "PAID",
      subtotalInCents: 5360,
      discountInCents: 360,
      totalInCents: 5000,
      changeInCents: 0,
      deliveryRequired: true,
    },
    create: {
      id: "018f3ef0-3000-7000-9000-000000000001",
      tenantId: DEFAULT_TENANT_ID,
      number: "PDV-SEED-0001",
      operatorId: cashierId,
      customerId,
      cashSessionId,
      status: "PAID",
      subtotalInCents: 5360,
      discountInCents: 360,
      totalInCents: 5000,
      changeInCents: 0,
      deliveryRequired: true,
    },
  });

  const saleItems = await Promise.all([
    prisma.saleItem.upsert({
      where: {
        id_tenantId: {
          id: "018f3ef0-4000-7000-9000-000000000001",
          tenantId: DEFAULT_TENANT_ID,
        },
      },
      update: {
        tenantId: DEFAULT_TENANT_ID,
        saleId: sale.id,
        productId: arroz.id,
        productName: arroz.name,
        quantity: 1,
        unitPriceInCents: arroz.priceInCents,
        unitCostInCents: arroz.costInCents,
        totalInCents: arroz.priceInCents,
      },
      create: {
        id: "018f3ef0-4000-7000-9000-000000000001",
        tenantId: DEFAULT_TENANT_ID,
        saleId: sale.id,
        productId: arroz.id,
        productName: arroz.name,
        quantity: 1,
        unitPriceInCents: arroz.priceInCents,
        unitCostInCents: arroz.costInCents,
        totalInCents: arroz.priceInCents,
      },
    }),
    prisma.saleItem.upsert({
      where: {
        id_tenantId: {
          id: "018f3ef0-4000-7000-9000-000000000002",
          tenantId: DEFAULT_TENANT_ID,
        },
      },
      update: {
        tenantId: DEFAULT_TENANT_ID,
        saleId: sale.id,
        productId: cafe.id,
        productName: cafe.name,
        quantity: 1,
        unitPriceInCents: cafe.priceInCents,
        unitCostInCents: cafe.costInCents,
        totalInCents: cafe.priceInCents,
      },
      create: {
        id: "018f3ef0-4000-7000-9000-000000000002",
        tenantId: DEFAULT_TENANT_ID,
        saleId: sale.id,
        productId: cafe.id,
        productName: cafe.name,
        quantity: 1,
        unitPriceInCents: cafe.priceInCents,
        unitCostInCents: cafe.costInCents,
        totalInCents: cafe.priceInCents,
      },
    }),
    prisma.saleItem.upsert({
      where: {
        id_tenantId: {
          id: "018f3ef0-4000-7000-9000-000000000003",
          tenantId: DEFAULT_TENANT_ID,
        },
      },
      update: {
        tenantId: DEFAULT_TENANT_ID,
        saleId: sale.id,
        productId: banana.id,
        productName: banana.name,
        quantity: 0.4,
        unitPriceInCents: banana.priceInCents,
        unitCostInCents: banana.costInCents,
        totalInCents: 280,
      },
      create: {
        id: "018f3ef0-4000-7000-9000-000000000003",
        tenantId: DEFAULT_TENANT_ID,
        saleId: sale.id,
        productId: banana.id,
        productName: banana.name,
        quantity: 0.4,
        unitPriceInCents: banana.priceInCents,
        unitCostInCents: banana.costInCents,
        totalInCents: 280,
      },
    }),
  ]);

  await Promise.all([
    prisma.payment.upsert({
      where: {
        id_tenantId: {
          id: "018f3ef0-5000-7000-9000-000000000001",
          tenantId: DEFAULT_TENANT_ID,
        },
      },
      update: {
        tenantId: DEFAULT_TENANT_ID,
        saleId: sale.id,
        method: "PIX",
        status: "APPROVED",
        amountInCents: 3000,
        provider: "Banco Pix Seed",
        externalTransactionId: "PIX-SEED-0001",
        terminalId: null,
      },
      create: {
        id: "018f3ef0-5000-7000-9000-000000000001",
        tenantId: DEFAULT_TENANT_ID,
        saleId: sale.id,
        method: "PIX",
        status: "APPROVED",
        amountInCents: 3000,
        provider: "Banco Pix Seed",
        externalTransactionId: "PIX-SEED-0001",
      },
    }),
    prisma.payment.upsert({
      where: {
        id_tenantId: {
          id: "018f3ef0-5000-7000-9000-000000000002",
          tenantId: DEFAULT_TENANT_ID,
        },
      },
      update: {
        tenantId: DEFAULT_TENANT_ID,
        saleId: sale.id,
        method: "CARD",
        status: "APPROVED",
        amountInCents: 2000,
        provider: "TEF Seed",
        externalTransactionId: "TEF-SEED-0001",
        terminalId: "PDV-01",
      },
      create: {
        id: "018f3ef0-5000-7000-9000-000000000002",
        tenantId: DEFAULT_TENANT_ID,
        saleId: sale.id,
        method: "CARD",
        status: "APPROVED",
        amountInCents: 2000,
        provider: "TEF Seed",
        externalTransactionId: "TEF-SEED-0001",
        terminalId: "PDV-01",
      },
    }),
    prisma.fiscalDocument.upsert({
      where: { saleId: sale.id },
      update: {
        tenantId: DEFAULT_TENANT_ID,
        kind: "NFC_E",
        status: "CONTINGENCY",
        accessKey: null,
        contingencyReason: "Seed com emissão fiscal em contingência",
      },
      create: {
        id: "018f3ef0-6000-7000-9000-000000000001",
        tenantId: DEFAULT_TENANT_ID,
        saleId: sale.id,
        kind: "NFC_E",
        status: "CONTINGENCY",
        contingencyReason: "Seed com emissão fiscal em contingência",
      },
    }),
    prisma.deliveryOrder.upsert({
      where: { saleId: sale.id },
      update: {
        tenantId: DEFAULT_TENANT_ID,
        customerId,
        trackingCode: "DLV-SEED-0001",
        recipientName: "Cliente Delivery",
        phone: "31999998888",
        address: "Rua do Cliente, 321 - Apto 12",
        notes: "Entregar no período da tarde",
        status: "OUT_FOR_DELIVERY",
      },
      create: {
        id: "018f3ef0-7000-7000-9000-000000000001",
        tenantId: DEFAULT_TENANT_ID,
        saleId: sale.id,
        customerId,
        trackingCode: "DLV-SEED-0001",
        recipientName: "Cliente Delivery",
        phone: "31999998888",
        address: "Rua do Cliente, 321 - Apto 12",
        notes: "Entregar no período da tarde",
        status: "OUT_FOR_DELIVERY",
      },
    }),
    prisma.signature.upsert({
      where: { saleId: sale.id },
      update: {
        tenantId: DEFAULT_TENANT_ID,
        customerId,
        status: "SIGNED",
        signatureImageUrl: "data:image/png;base64,seed-signature-placeholder",
        signedAt: new Date(),
      },
      create: {
        id: "018f3ef0-8000-7000-9000-000000000001",
        tenantId: DEFAULT_TENANT_ID,
        saleId: sale.id,
        customerId,
        status: "SIGNED",
        signatureImageUrl: "data:image/png;base64,seed-signature-placeholder",
        signedAt: new Date(),
      },
    }),
  ]);

  await Promise.all([
    prisma.stockMovement.upsert({
      where: {
        id_tenantId: {
          id: "018f3ef0-9000-7000-9000-000000000001",
          tenantId: DEFAULT_TENANT_ID,
        },
      },
      update: {
        tenantId: DEFAULT_TENANT_ID,
        productId: arroz.id,
        saleItemId: saleItems[0].id,
        operatorId: cashierId,
        type: "SALE",
        quantity: 1,
        previousQuantity: 43,
        nextQuantity: 42,
        reason: "Venda seed PDV-SEED-0001",
      },
      create: {
        id: "018f3ef0-9000-7000-9000-000000000001",
        tenantId: DEFAULT_TENANT_ID,
        productId: arroz.id,
        saleItemId: saleItems[0].id,
        operatorId: cashierId,
        type: "SALE",
        quantity: 1,
        previousQuantity: 43,
        nextQuantity: 42,
        reason: "Venda seed PDV-SEED-0001",
      },
    }),
    prisma.stockMovement.upsert({
      where: {
        id_tenantId: {
          id: "018f3ef0-9000-7000-9000-000000000002",
          tenantId: DEFAULT_TENANT_ID,
        },
      },
      update: {
        tenantId: DEFAULT_TENANT_ID,
        productId: cafe.id,
        saleItemId: saleItems[1].id,
        operatorId: cashierId,
        type: "SALE",
        quantity: 1,
        previousQuantity: 28,
        nextQuantity: 27,
        reason: "Venda seed PDV-SEED-0001",
      },
      create: {
        id: "018f3ef0-9000-7000-9000-000000000002",
        tenantId: DEFAULT_TENANT_ID,
        productId: cafe.id,
        saleItemId: saleItems[1].id,
        operatorId: cashierId,
        type: "SALE",
        quantity: 1,
        previousQuantity: 28,
        nextQuantity: 27,
        reason: "Venda seed PDV-SEED-0001",
      },
    }),
    prisma.stockMovement.upsert({
      where: {
        id_tenantId: {
          id: "018f3ef0-9000-7000-9000-000000000003",
          tenantId: DEFAULT_TENANT_ID,
        },
      },
      update: {
        tenantId: DEFAULT_TENANT_ID,
        productId: banana.id,
        saleItemId: saleItems[2].id,
        operatorId: cashierId,
        type: "SALE",
        quantity: 0.4,
        previousQuantity: 33.9,
        nextQuantity: 33.5,
        reason: "Venda seed PDV-SEED-0001",
      },
      create: {
        id: "018f3ef0-9000-7000-9000-000000000003",
        tenantId: DEFAULT_TENANT_ID,
        productId: banana.id,
        saleItemId: saleItems[2].id,
        operatorId: cashierId,
        type: "SALE",
        quantity: 0.4,
        previousQuantity: 33.9,
        nextQuantity: 33.5,
        reason: "Venda seed PDV-SEED-0001",
      },
    }),
  ]);

  return sale;
};

const seedAuditLogs = async ({ userId, saleId }: { userId: string; saleId: string }) => {
  await Promise.all([
    prisma.auditLog.upsert({
      where: {
        id_tenantId: {
          id: "018f3ef0-a000-7000-9000-000000000001",
          tenantId: DEFAULT_TENANT_ID,
        },
      },
      update: {
        tenantId: DEFAULT_TENANT_ID,
        userId,
        action: "SEED_EXECUTED",
        entity: "Database",
        entityId: "seed",
        metadata: { source: "prisma/seed.ts" },
      },
      create: {
        id: "018f3ef0-a000-7000-9000-000000000001",
        tenantId: DEFAULT_TENANT_ID,
        userId,
        action: "SEED_EXECUTED",
        entity: "Database",
        entityId: "seed",
        metadata: { source: "prisma/seed.ts" },
      },
    }),
    prisma.auditLog.upsert({
      where: {
        id_tenantId: {
          id: "018f3ef0-a000-7000-9000-000000000002",
          tenantId: DEFAULT_TENANT_ID,
        },
      },
      update: {
        tenantId: DEFAULT_TENANT_ID,
        userId,
        action: "SALE_REGISTERED",
        entity: "Sale",
        entityId: saleId,
        metadata: { number: "PDV-SEED-0001", totalInCents: 5000 },
      },
      create: {
        id: "018f3ef0-a000-7000-9000-000000000002",
        tenantId: DEFAULT_TENANT_ID,
        userId,
        action: "SALE_REGISTERED",
        entity: "Sale",
        entityId: saleId,
        metadata: { number: "PDV-SEED-0001", totalInCents: 5000 },
      },
    }),
  ]);
};

const seed = async () => {
  const seededUsers = await seedUsers();
  await seedProducts();
  const customers = await seedCustomers();
  const cashSession = await seedCashRegister({ cashierId: seededUsers.cashier.id });
  const sale = await seedSale({
    cashierId: seededUsers.cashier.id,
    cashSessionId: cashSession.id,
    customerId: customers[2].id,
  });
  await seedAuditLogs({ userId: seededUsers.admin.id, saleId: sale.id });

  console.log("Seed finalizado com sucesso.");
  console.table(
    users.map((user) => ({
      email: user.email,
      senha: user.password,
      perfil: user.role,
    })),
  );
};

try {
  await seed();
} finally {
  await prisma.$disconnect();
}
