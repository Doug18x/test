import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Flame, Plus, X, Minus, Check, ChevronLeft, Eye, EyeOff, Search, ScanLine,
  Home, UtensilsCrossed, Dumbbell, UserRound, Footprints, Bike, Activity,
  ChevronDown, TrendingDown, LogOut, Sparkles, RefreshCw, ArrowRight,
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

// ---------- Paleta extraída do template (medida app) ----------
const DARK = "#16211C";
const BG = "#EDEEE8";
const ORANGE = "#FF5A36";
const TEAL = "#1F6F5C";
const PURPLE = "#7B5FD9";
const GOLD = "#E8B24D";
const MUTED = "#8A8F87";
const BORDER = "#E1E2DC";

const SUBSTITUICOES = {
  "Arroz branco cozido": { alt: "Couve-flor picada refogada", economiaPor100g: 105 },
  "Pão francês": { alt: "Pão de forma integral", economiaPor100g: 47 },
  "Batata frita": { alt: "Batata assada", economiaPor100g: 219 },
  "Refrigerante": { alt: "Água de coco", economiaPor100g: 20 },
  "Requeijão": { alt: "Ricota", economiaPor100g: 117 },
  "Carne bovina moída (acém)": { alt: "Carne bovina moída (patinho)", economiaPor100g: 40 },
  "Chocolate ao leite": { alt: "Mamão", economiaPor100g: 500 },
  "Queijo muçarela": { alt: "Queijo cottage", economiaPor100g: 232 },
  "Bacon frito": { alt: "Peito de peru defumado", economiaPor100g: 447 },
  "Maionese": { alt: "Iogurte natural desnatado", economiaPor100g: 312 },
  "Salgadinho de pacote (chips)": { alt: "Pipoca sem óleo", economiaPor100g: 149 },
  "Miojo (macarrão instantâneo)": { alt: "Macarrão integral cozido", economiaPor100g: 312 },
};

// Distribuição aproximada de macronutrientes por grupo alimentar (% das kcal)
const MACROS_POR_GRUPO = {
  "Cereais": { p: 0.10, c: 0.80, g: 0.10 },
  "Leguminosas": { p: 0.25, c: 0.65, g: 0.10 },
  "Verduras e legumes": { p: 0.15, c: 0.75, g: 0.10 },
  "Frutas": { p: 0.05, c: 0.90, g: 0.05 },
  "Carnes e ovos": { p: 0.50, c: 0.05, g: 0.45 },
  "Laticínios": { p: 0.25, c: 0.25, g: 0.50 },
  "Óleos e gorduras": { p: 0.00, c: 0.00, g: 1.00 },
  "Oleaginosas": { p: 0.12, c: 0.15, g: 0.73 },
  "Açúcares e doces": { p: 0.05, c: 0.60, g: 0.35 },
  "Bebidas": { p: 0.05, c: 0.90, g: 0.05 },
  "Industrializados": { p: 0.15, c: 0.45, g: 0.40 },
  "Condimentos": { p: 0.10, c: 0.50, g: 0.40 },
};

function macrosDoAlimento(kcal, grupo) {
  const perfil = MACROS_POR_GRUPO[grupo] || { p: 0.2, c: 0.5, g: 0.3 };
  return {
    p: Math.round((kcal * perfil.p) / 4),
    c: Math.round((kcal * perfil.c) / 4),
    g: Math.round((kcal * perfil.g) / 9),
  };
}

const EXERCISE_DB = [
  { nome: "Caminhada leve", met: 3.5 },
  { nome: "Caminhada rápida", met: 4.8 },
  { nome: "Natação", met: 7.0 },
  { nome: "Pular corda", met: 11 },
  { nome: "Dança", met: 5.5 },
  { nome: "Yoga", met: 2.5 },
  { nome: "HIIT", met: 9.5 },
];

const CATEGORIAS_TREINO = [
  { id: "musculacao", label: "Musculação", met: 5.0, icon: Dumbbell },
  { id: "corrida", label: "Corrida", met: 9.0, icon: Footprints },
  { id: "bike", label: "Bike", met: 7.5, icon: Bike },
  { id: "mais", label: "Mais", met: null, icon: Activity },
];

const FATORES_ATIVIDADE = [
  { id: "sedentaria", label: "Sedentária", fator: 1.2 },
  { id: "leve", label: "Leve", fator: 1.375 },
  { id: "ativa", label: "Ativa", fator: 1.55 },
  { id: "intensa", label: "Intensa", fator: 1.725 },
];

// 1 kg de gordura corporal ≈ 7700 kcal. O déficit/superávit diário deriva da meta semanal.
const KCAL_POR_KG = 7700;
const OBJETIVOS = [
  { id: "perder", label: "Perder peso", desc: "-0,5 kg/sem", kgPorSemana: -0.5 },
  { id: "manter", label: "Manter", desc: "estável", kgPorSemana: 0 },
  { id: "ganhar", label: "Ganhar", desc: "+0,25 kg/sem", kgPorSemana: 0.25 },
];

const MEAL_TYPES = [
  { id: "cafe", label: "Café" },
  { id: "almoco", label: "Almoço" },
  { id: "lanche", label: "Lanche" },
  { id: "jantar", label: "Jantar" },
];

const THUMB_COLORS = ["#E8D9C3", "#D9C3A8", "#C7DFC9", "#F0D9B5", "#D9CDE8", "#C9DDE8"];
const thumbColor = (nome) => THUMB_COLORS[nome.length % THUMB_COLORS.length];

function calcularMetas(profile) {
  const base = 10 * profile.peso + 6.25 * profile.altura - 5 * profile.idade;
  const constanteSexo = profile.sexo === "M" ? 5 : profile.sexo === "Outro" ? -78 : -161;
  const tmb = Math.round(base + constanteSexo);
  const fator = (FATORES_ATIVIDADE.find((f) => f.id === profile.atividade) || FATORES_ATIVIDADE[1]).fator;
  const get = Math.round(tmb * fator);
  const objetivo = OBJETIVOS.find((o) => o.id === profile.objetivo) || OBJETIVOS[0];
  const minimoSeguro = profile.sexo === "M" ? 1500 : 1200;

  // Ajuste diário derivado da meta semanal (negativo = déficit)
  const ajusteDiario = Math.round((objetivo.kgPorSemana * KCAL_POR_KG) / 7);
  let metaDiaria = get + ajusteDiario;

  // Trava de segurança: nunca abaixo do mínimo, nem abaixo da própria TMB
  const piso = Math.max(minimoSeguro, Math.round(tmb * 0.95));
  let metaLimitada = false;
  if (metaDiaria < piso) { metaDiaria = piso; metaLimitada = true; }

  const deficitReal = get - metaDiaria;
  const kgSemanaReal = (deficitReal * 7) / KCAL_POR_KG;

  const macrosAlvo = {
    p: Math.round((metaDiaria * 0.25) / 4),
    c: Math.round((metaDiaria * 0.45) / 4),
    g: Math.round((metaDiaria * 0.30) / 9),
  };
  return { tmb, get, metaDiaria, macrosAlvo, minimoSeguro, deficitReal, kgSemanaReal, metaLimitada, piso };
}

const emptyMeals = () => ({ cafe: [], almoco: [], jantar: [], lanche: [] });
const todayKey = () => new Date().toISOString().slice(0, 10);
const diffDays = (a, b) => Math.round((new Date(a) - new Date(b)) / 86400000);
const formatDataLonga = () => {
  const d = new Date();
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).toUpperCase();
};

const TACO = [
  // Cereais e derivados
  { nome: "Arroz branco cozido", kcal100g: 128, grupo: "Cereais" , unidade: { label: "col. de sopa", gramas: 25 } },
  { nome: "Arroz integral cozido", kcal100g: 124, grupo: "Cereais" , unidade: { label: "col. de sopa", gramas: 25 } },
  { nome: "Arroz parboilizado cozido", kcal100g: 123, grupo: "Cereais" , unidade: { label: "col. de sopa", gramas: 25 } },
  { nome: "Pão francês", kcal100g: 300, grupo: "Cereais" , unidade: { label: "unidade", gramas: 50 } },
  { nome: "Pão de forma integral", kcal100g: 253, grupo: "Cereais" , unidade: { label: "fatia", gramas: 25 }, codigoBarras: "7891000100103" },
  { nome: "Pão de forma branco", kcal100g: 271, grupo: "Cereais" , unidade: { label: "fatia", gramas: 25 } },
  { nome: "Pão de queijo", kcal100g: 364, grupo: "Cereais" , unidade: { label: "unidade", gramas: 30 } },
  { nome: "Pão sírio", kcal100g: 275, grupo: "Cereais" , unidade: { label: "unidade", gramas: 60 } },
  { nome: "Aveia em flocos", kcal100g: 394, grupo: "Cereais" , unidade: { label: "col. de sopa", gramas: 15 } },
  { nome: "Farinha de trigo", kcal100g: 360, grupo: "Cereais" , unidade: { label: "col. de sopa", gramas: 12 } },
  { nome: "Farinha de mandioca", kcal100g: 361, grupo: "Cereais" , unidade: { label: "col. de sopa", gramas: 10 } },
  { nome: "Farinha de milho", kcal100g: 351, grupo: "Cereais" , unidade: { label: "col. de sopa", gramas: 12 } },
  { nome: "Macarrão cozido", kcal100g: 111, grupo: "Cereais" , unidade: { label: "pegador", gramas: 80 } },
  { nome: "Macarrão integral cozido", kcal100g: 124, grupo: "Cereais" , unidade: { label: "pegador", gramas: 80 } },
  { nome: "Lasanha (massa)", kcal100g: 135, grupo: "Cereais" , unidade: { label: "porção", gramas: 150 } },
  { nome: "Tapioca", kcal100g: 240, grupo: "Cereais" , unidade: { label: "unidade", gramas: 60 } },
  { nome: "Cuscuz de milho", kcal100g: 112, grupo: "Cereais" , unidade: { label: "fatia", gramas: 80 } },
  { nome: "Polenta", kcal100g: 116, grupo: "Cereais" , unidade: { label: "fatia", gramas: 80 } },
  { nome: "Granola", kcal100g: 471, grupo: "Cereais" , unidade: { label: "col. de sopa", gramas: 15 } },
  { nome: "Milho verde cozido", kcal100g: 98, grupo: "Cereais" , unidade: { label: "espiga", gramas: 90 } },
  { nome: "Pipoca sem óleo", kcal100g: 387, grupo: "Cereais" , unidade: { label: "xícara", gramas: 10 } },
  { nome: "Biscoito cream cracker", kcal100g: 432, grupo: "Cereais" , unidade: { label: "unidade", gramas: 7 } },
  { nome: "Torrada integral", kcal100g: 411, grupo: "Cereais" , unidade: { label: "fatia", gramas: 8 } },
  { nome: "Quinoa cozida", kcal100g: 120, grupo: "Cereais" , unidade: { label: "col. de sopa", gramas: 20 } },
  { nome: "Centeio integral", kcal100g: 336, grupo: "Cereais" , unidade: { label: "col. de sopa", gramas: 15 } },

  // Leguminosas
  { nome: "Feijão carioca cozido", kcal100g: 76, grupo: "Leguminosas" , unidade: { label: "concha", gramas: 80 } },
  { nome: "Feijão preto cozido", kcal100g: 77, grupo: "Leguminosas" , unidade: { label: "concha", gramas: 80 } },
  { nome: "Feijão branco cozido", kcal100g: 90, grupo: "Leguminosas" , unidade: { label: "concha", gramas: 80 } },
  { nome: "Feijão fradinho cozido", kcal100g: 83, grupo: "Leguminosas" , unidade: { label: "concha", gramas: 80 } },
  { nome: "Lentilha cozida", kcal100g: 93, grupo: "Leguminosas" , unidade: { label: "concha", gramas: 80 } },
  { nome: "Grão-de-bico cozido", kcal100g: 121, grupo: "Leguminosas" , unidade: { label: "concha", gramas: 80 } },
  { nome: "Ervilha cozida", kcal100g: 76, grupo: "Leguminosas" , unidade: { label: "col. de sopa", gramas: 20 } },
  { nome: "Soja cozida", kcal100g: 173, grupo: "Leguminosas" , unidade: { label: "col. de sopa", gramas: 20 } },
  { nome: "Tofu", kcal100g: 76, grupo: "Leguminosas" , unidade: { label: "fatia", gramas: 60 } },
  { nome: "Grão de bico torrado", kcal100g: 356, grupo: "Leguminosas" , unidade: { label: "punhado", gramas: 30 } },
  { nome: "Fava cozida", kcal100g: 88, grupo: "Leguminosas" , unidade: { label: "concha", gramas: 80 } },
  { nome: "Amendoim cozido", kcal100g: 344, grupo: "Leguminosas" , unidade: { label: "punhado", gramas: 30 } },

  // Verduras e legumes
  { nome: "Alface", kcal100g: 15, grupo: "Verduras e legumes" , unidade: { label: "pires", gramas: 30 } },
  { nome: "Rúcula", kcal100g: 25, grupo: "Verduras e legumes" , unidade: { label: "pires", gramas: 30 } },
  { nome: "Agrião", kcal100g: 22, grupo: "Verduras e legumes" , unidade: { label: "pires", gramas: 30 } },
  { nome: "Espinafre cozido", kcal100g: 28, grupo: "Verduras e legumes" , unidade: { label: "col. de sopa", gramas: 25 } },
  { nome: "Couve refogada", kcal100g: 39, grupo: "Verduras e legumes" , unidade: { label: "col. de sopa", gramas: 20 } },
  { nome: "Brócolis cozido", kcal100g: 25, grupo: "Verduras e legumes" , unidade: { label: "col. de sopa", gramas: 25 } },
  { nome: "Couve-flor picada refogada", kcal100g: 23, grupo: "Verduras e legumes" , unidade: { label: "col. de sopa", gramas: 25 } },
  { nome: "Repolho cru", kcal100g: 24, grupo: "Verduras e legumes" , unidade: { label: "pires", gramas: 30 } },
  { nome: "Cenoura crua", kcal100g: 41, grupo: "Verduras e legumes" , unidade: { label: "unidade", gramas: 70 } },
  { nome: "Cenoura cozida", kcal100g: 32, grupo: "Verduras e legumes" , unidade: { label: "col. de sopa", gramas: 25 } },
  { nome: "Tomate", kcal100g: 15, grupo: "Verduras e legumes" , unidade: { label: "unidade", gramas: 100 } },
  { nome: "Pepino", kcal100g: 10, grupo: "Verduras e legumes" , unidade: { label: "unidade", gramas: 130 } },
  { nome: "Abobrinha refogada", kcal100g: 21, grupo: "Verduras e legumes" , unidade: { label: "col. de sopa", gramas: 30 } },
  { nome: "Abóbora cozida", kcal100g: 40, grupo: "Verduras e legumes" , unidade: { label: "col. de sopa", gramas: 30 } },
  { nome: "Berinjela refogada", kcal100g: 35, grupo: "Verduras e legumes" , unidade: { label: "col. de sopa", gramas: 30 } },
  { nome: "Pimentão", kcal100g: 26, grupo: "Verduras e legumes" , unidade: { label: "unidade", gramas: 100 } },
  { nome: "Cebola crua", kcal100g: 39, grupo: "Verduras e legumes" , unidade: { label: "unidade", gramas: 70 } },
  { nome: "Alho", kcal100g: 113, grupo: "Verduras e legumes" , unidade: { label: "dente", gramas: 3 } },
  { nome: "Beterraba cozida", kcal100g: 32, grupo: "Verduras e legumes" , unidade: { label: "col. de sopa", gramas: 25 } },
  { nome: "Vagem cozida", kcal100g: 21, grupo: "Verduras e legumes" , unidade: { label: "col. de sopa", gramas: 20 } },
  { nome: "Quiabo cozido", kcal100g: 26, grupo: "Verduras e legumes" , unidade: { label: "col. de sopa", gramas: 25 } },
  { nome: "Chuchu cozido", kcal100g: 19, grupo: "Verduras e legumes" , unidade: { label: "col. de sopa", gramas: 30 } },
  { nome: "Batata cozida", kcal100g: 52, grupo: "Verduras e legumes" , unidade: { label: "unidade", gramas: 150 } },
  { nome: "Batata assada", kcal100g: 93, grupo: "Verduras e legumes" , unidade: { label: "unidade", gramas: 150 } },
  { nome: "Batata frita", kcal100g: 312, grupo: "Verduras e legumes" , unidade: { label: "porção", gramas: 100 } },
  { nome: "Batata-doce cozida", kcal100g: 77, grupo: "Verduras e legumes" , unidade: { label: "unidade", gramas: 130 } },
  { nome: "Mandioca cozida", kcal100g: 125, grupo: "Verduras e legumes" , unidade: { label: "pedaço", gramas: 80 } },
  { nome: "Inhame cozido", kcal100g: 97, grupo: "Verduras e legumes" , unidade: { label: "pedaço", gramas: 80 } },
  { nome: "Cogumelo shimeji refogado", kcal100g: 33, grupo: "Verduras e legumes" , unidade: { label: "col. de sopa", gramas: 25 } },
  { nome: "Champignon em conserva", kcal100g: 24, grupo: "Verduras e legumes" , unidade: { label: "col. de sopa", gramas: 20 } },
  { nome: "Milho verde em conserva", kcal100g: 90, grupo: "Verduras e legumes" , unidade: { label: "col. de sopa", gramas: 20 } },
  { nome: "Palmito em conserva", kcal100g: 26, grupo: "Verduras e legumes" , unidade: { label: "unidade", gramas: 25 } },
  { nome: "Aspargo cozido", kcal100g: 22, grupo: "Verduras e legumes" , unidade: { label: "unidade", gramas: 15 } },
  { nome: "Salsão", kcal100g: 16, grupo: "Verduras e legumes" , unidade: { label: "talo", gramas: 40 } },
  { nome: "Acelga", kcal100g: 19, grupo: "Verduras e legumes" , unidade: { label: "pires", gramas: 30 } },

  // Frutas
  { nome: "Banana", kcal100g: 92, grupo: "Frutas" , unidade: { label: "unidade", gramas: 90 } },
  { nome: "Banana-da-terra frita", kcal100g: 219, grupo: "Frutas" , unidade: { label: "unidade", gramas: 100 } },
  { nome: "Maçã", kcal100g: 56, grupo: "Frutas" , unidade: { label: "unidade", gramas: 130 } },
  { nome: "Pera", kcal100g: 53, grupo: "Frutas" , unidade: { label: "unidade", gramas: 140 } },
  { nome: "Mamão", kcal100g: 40, grupo: "Frutas" , unidade: { label: "fatia", gramas: 150 } },
  { nome: "Laranja", kcal100g: 45, grupo: "Frutas" , unidade: { label: "unidade", gramas: 150 } },
  { nome: "Tangerina", kcal100g: 38, grupo: "Frutas" , unidade: { label: "unidade", gramas: 100 } },
  { nome: "Limão", kcal100g: 32, grupo: "Frutas" , unidade: { label: "unidade", gramas: 60 } },
  { nome: "Abacate", kcal100g: 96, grupo: "Frutas" , unidade: { label: "col. de sopa", gramas: 30 } },
  { nome: "Manga", kcal100g: 64, grupo: "Frutas" , unidade: { label: "unidade", gramas: 200 } },
  { nome: "Abacaxi", kcal100g: 48, grupo: "Frutas" , unidade: { label: "fatia", gramas: 80 } },
  { nome: "Uva", kcal100g: 53, grupo: "Frutas" , unidade: { label: "cacho pequeno", gramas: 100 } },
  { nome: "Melancia", kcal100g: 33, grupo: "Frutas" , unidade: { label: "fatia", gramas: 150 } },
  { nome: "Melão", kcal100g: 29, grupo: "Frutas" , unidade: { label: "fatia", gramas: 120 } },
  { nome: "Morango", kcal100g: 30, grupo: "Frutas" , unidade: { label: "unidade", gramas: 12 } },
  { nome: "Kiwi", kcal100g: 51, grupo: "Frutas" , unidade: { label: "unidade", gramas: 70 } },
  { nome: "Goiaba", kcal100g: 54, grupo: "Frutas" , unidade: { label: "unidade", gramas: 130 } },
  { nome: "Maracujá", kcal100g: 68, grupo: "Frutas" , unidade: { label: "unidade", gramas: 60 } },
  { nome: "Caju", kcal100g: 43, grupo: "Frutas" , unidade: { label: "unidade", gramas: 70 } },
  { nome: "Ameixa", kcal100g: 46, grupo: "Frutas" , unidade: { label: "unidade", gramas: 60 } },
  { nome: "Pêssego", kcal100g: 40, grupo: "Frutas" , unidade: { label: "unidade", gramas: 100 } },
  { nome: "Figo", kcal100g: 41, grupo: "Frutas" , unidade: { label: "unidade", gramas: 50 } },
  { nome: "Coco ralado", kcal100g: 406, grupo: "Frutas" , unidade: { label: "col. de sopa", gramas: 10 } },
  { nome: "Jaca", kcal100g: 88, grupo: "Frutas" , unidade: { label: "bago", gramas: 20 } },
  { nome: "Graviola", kcal100g: 62, grupo: "Frutas" , unidade: { label: "fatia", gramas: 100 } },
  { nome: "Fruta-do-conde", kcal100g: 94, grupo: "Frutas" , unidade: { label: "unidade", gramas: 150 } },
  { nome: "Carambola", kcal100g: 33, grupo: "Frutas" , unidade: { label: "unidade", gramas: 90 } },
  { nome: "Framboesa", kcal100g: 52, grupo: "Frutas" , unidade: { label: "punhado", gramas: 30 } },
  { nome: "Mirtilo (blueberry)", kcal100g: 57, grupo: "Frutas" , unidade: { label: "punhado", gramas: 30 } },
  { nome: "Damasco seco", kcal100g: 241, grupo: "Frutas" , unidade: { label: "unidade", gramas: 8 } },

  // Carnes, aves, peixes e ovos
  { nome: "Peito de frango grelhado", kcal100g: 159, grupo: "Carnes e ovos" , unidade: { label: "filé médio", gramas: 100 } },
  { nome: "Coxa de frango assada", kcal100g: 215, grupo: "Carnes e ovos" , unidade: { label: "unidade", gramas: 90 } },
  { nome: "Frango à passarinho frito", kcal100g: 290, grupo: "Carnes e ovos" , unidade: { label: "pedaço", gramas: 40 } },
  { nome: "Carne bovina moída (patinho)", kcal100g: 172, grupo: "Carnes e ovos" , unidade: { label: "col. de sopa", gramas: 25 } },
  { nome: "Carne bovina moída (acém)", kcal100g: 212, grupo: "Carnes e ovos" , unidade: { label: "col. de sopa", gramas: 25 } },
  { nome: "Picanha grelhada", kcal100g: 289, grupo: "Carnes e ovos" , unidade: { label: "fatia", gramas: 80 } },
  { nome: "Alcatra grelhada", kcal100g: 163, grupo: "Carnes e ovos" , unidade: { label: "bife", gramas: 100 } },
  { nome: "Contrafilé grelhado", kcal100g: 220, grupo: "Carnes e ovos" , unidade: { label: "bife", gramas: 100 } },
  { nome: "Filé mignon grelhado", kcal100g: 179, grupo: "Carnes e ovos" , unidade: { label: "medalhão", gramas: 90 } },
  { nome: "Costela bovina assada", kcal100g: 350, grupo: "Carnes e ovos" , unidade: { label: "pedaço", gramas: 120 } },
  { nome: "Carne de porco (lombo) assada", kcal100g: 210, grupo: "Carnes e ovos" , unidade: { label: "fatia", gramas: 80 } },
  { nome: "Bacon frito", kcal100g: 541, grupo: "Carnes e ovos" , unidade: { label: "fatia", gramas: 10 } },
  { nome: "Linguiça toscana", kcal100g: 320, grupo: "Carnes e ovos" , unidade: { label: "gomo", gramas: 60 } },
  { nome: "Salsicha", kcal100g: 257, grupo: "Carnes e ovos" , unidade: { label: "unidade", gramas: 50 } },
  { nome: "Presunto", kcal100g: 111, grupo: "Carnes e ovos" , unidade: { label: "fatia", gramas: 15 } },
  { nome: "Peito de peru defumado", kcal100g: 94, grupo: "Carnes e ovos" , unidade: { label: "fatia", gramas: 15 } },
  { nome: "Mortadela", kcal100g: 269, grupo: "Carnes e ovos" , unidade: { label: "fatia", gramas: 15 } },
  { nome: "Tilápia grelhada", kcal100g: 128, grupo: "Carnes e ovos" , unidade: { label: "filé", gramas: 120 } },
  { nome: "Salmão grelhado", kcal100g: 208, grupo: "Carnes e ovos" , unidade: { label: "posta", gramas: 120 } },
  { nome: "Sardinha grelhada", kcal100g: 210, grupo: "Carnes e ovos" , unidade: { label: "unidade", gramas: 50 } },
  { nome: "Bacalhau cozido", kcal100g: 136, grupo: "Carnes e ovos" , unidade: { label: "posta", gramas: 100 } },
  { nome: "Camarão cozido", kcal100g: 90, grupo: "Carnes e ovos" , unidade: { label: "unidade", gramas: 8 } },
  { nome: "Atum em lata (água)", kcal100g: 116, grupo: "Carnes e ovos" , unidade: { label: "lata", gramas: 120 } },
  { nome: "Atum em lata (óleo)", kcal100g: 189, grupo: "Carnes e ovos" , unidade: { label: "lata", gramas: 120 } },
  { nome: "Ovo cozido", kcal100g: 146, grupo: "Carnes e ovos" , unidade: { label: "unidade", gramas: 50 } },
  { nome: "Ovo frito", kcal100g: 196, grupo: "Carnes e ovos" , unidade: { label: "unidade", gramas: 50 } },
  { nome: "Ovo mexido", kcal100g: 168, grupo: "Carnes e ovos" , unidade: { label: "unidade", gramas: 55 } },
  { nome: "Clara de ovo cozida", kcal100g: 52, grupo: "Carnes e ovos" , unidade: { label: "unidade", gramas: 33 } },
  { nome: "Fígado bovino grelhado", kcal100g: 175, grupo: "Carnes e ovos" , unidade: { label: "bife", gramas: 90 } },
  { nome: "Peru assado (peito)", kcal100g: 149, grupo: "Carnes e ovos" , unidade: { label: "fatia", gramas: 60 } },

  // Laticínios
  { nome: "Leite integral", kcal100g: 61, grupo: "Laticínios" , unidade: { label: "copo", gramas: 200 }, codigoBarras: "7891000111213" },
  { nome: "Leite desnatado", kcal100g: 35, grupo: "Laticínios" , unidade: { label: "copo", gramas: 200 } },
  { nome: "Leite semidesnatado", kcal100g: 47, grupo: "Laticínios" , unidade: { label: "copo", gramas: 200 } },
  { nome: "Leite condensado", kcal100g: 313, grupo: "Laticínios" , unidade: { label: "col. de sopa", gramas: 20 } },
  { nome: "Creme de leite", kcal100g: 302, grupo: "Laticínios" , unidade: { label: "col. de sopa", gramas: 15 } },
  { nome: "Iogurte natural", kcal100g: 51, grupo: "Laticínios" , unidade: { label: "pote", gramas: 170 } },
  { nome: "Iogurte natural desnatado", kcal100g: 41, grupo: "Laticínios" , unidade: { label: "pote", gramas: 170 }, codigoBarras: "7891000053508" },
  { nome: "Iogurte grego", kcal100g: 97, grupo: "Laticínios" , unidade: { label: "pote", gramas: 100 }, codigoBarras: "7891000998877" },
  { nome: "Queijo minas frescal", kcal100g: 264, grupo: "Laticínios" , unidade: { label: "fatia", gramas: 30 } },
  { nome: "Queijo minas padrão", kcal100g: 351, grupo: "Laticínios" , unidade: { label: "fatia", gramas: 30 } },
  { nome: "Queijo muçarela", kcal100g: 330, grupo: "Laticínios" , unidade: { label: "fatia", gramas: 20 }, codigoBarras: "7891080101012" },
  { nome: "Queijo prato", kcal100g: 360, grupo: "Laticínios" , unidade: { label: "fatia", gramas: 20 } },
  { nome: "Queijo parmesão", kcal100g: 453, grupo: "Laticínios" , unidade: { label: "col. de sopa", gramas: 10 } },
  { nome: "Queijo cottage", kcal100g: 98, grupo: "Laticínios" , unidade: { label: "col. de sopa", gramas: 30 } },
  { nome: "Requeijão", kcal100g: 257, grupo: "Laticínios" , unidade: { label: "col. de sopa", gramas: 20 } },
  { nome: "Ricota", kcal100g: 140, grupo: "Laticínios" , unidade: { label: "fatia", gramas: 30 } },
  { nome: "Manteiga", kcal100g: 726, grupo: "Laticínios" , unidade: { label: "ponta de faca", gramas: 5 } },
  { nome: "Margarina", kcal100g: 596, grupo: "Laticínios" , unidade: { label: "ponta de faca", gramas: 5 } },

  // Óleos e gorduras
  { nome: "Azeite de oliva", kcal100g: 884, grupo: "Óleos e gorduras" , unidade: { label: "col. de sopa", gramas: 8 } },
  { nome: "Óleo de soja", kcal100g: 884, grupo: "Óleos e gorduras" , unidade: { label: "col. de sopa", gramas: 8 } },
  { nome: "Óleo de canola", kcal100g: 884, grupo: "Óleos e gorduras" , unidade: { label: "col. de sopa", gramas: 8 } },
  { nome: "Óleo de coco", kcal100g: 862, grupo: "Óleos e gorduras" , unidade: { label: "col. de sopa", gramas: 8 } },
  { nome: "Banha de porco", kcal100g: 902, grupo: "Óleos e gorduras" , unidade: { label: "col. de sopa", gramas: 12 } },
  { nome: "Maionese", kcal100g: 353, grupo: "Óleos e gorduras" , unidade: { label: "col. de sopa", gramas: 15 } },

  // Oleaginosas
  { nome: "Castanha-do-pará", kcal100g: 643, grupo: "Oleaginosas" , unidade: { label: "unidade", gramas: 5 } },
  { nome: "Castanha de caju", kcal100g: 570, grupo: "Oleaginosas" , unidade: { label: "unidade", gramas: 2 } },
  { nome: "Amêndoa", kcal100g: 579, grupo: "Oleaginosas" , unidade: { label: "unidade", gramas: 1 } },
  { nome: "Nozes", kcal100g: 654, grupo: "Oleaginosas" , unidade: { label: "unidade", gramas: 5 } },
  { nome: "Amendoim torrado", kcal100g: 606, grupo: "Oleaginosas" , unidade: { label: "punhado", gramas: 25 } },
  { nome: "Pistache", kcal100g: 562, grupo: "Oleaginosas" , unidade: { label: "unidade", gramas: 1 } },
  { nome: "Pasta de amendoim", kcal100g: 588, grupo: "Oleaginosas" , unidade: { label: "col. de sopa", gramas: 15 } },
  { nome: "Semente de chia", kcal100g: 486, grupo: "Oleaginosas" , unidade: { label: "col. de sopa", gramas: 12 } },
  { nome: "Semente de linhaça", kcal100g: 495, grupo: "Oleaginosas" , unidade: { label: "col. de sopa", gramas: 12 } },
  { nome: "Semente de girassol", kcal100g: 584, grupo: "Oleaginosas" , unidade: { label: "col. de sopa", gramas: 10 } },

  // Açúcares e doces
  { nome: "Açúcar refinado", kcal100g: 387, grupo: "Açúcares e doces" , unidade: { label: "col. de chá", gramas: 5 } },
  { nome: "Açúcar mascavo", kcal100g: 369, grupo: "Açúcares e doces" , unidade: { label: "col. de chá", gramas: 5 } },
  { nome: "Mel", kcal100g: 309, grupo: "Açúcares e doces" , unidade: { label: "col. de sopa", gramas: 20 } },
  { nome: "Geleia de fruta", kcal100g: 260, grupo: "Açúcares e doces" , unidade: { label: "col. de sopa", gramas: 20 } },
  { nome: "Doce de leite", kcal100g: 315, grupo: "Açúcares e doces" , unidade: { label: "col. de sopa", gramas: 20 } },
  { nome: "Chocolate ao leite", kcal100g: 540, grupo: "Açúcares e doces" , unidade: { label: "quadradinho", gramas: 6 } },
  { nome: "Chocolate amargo 70%", kcal100g: 598, grupo: "Açúcares e doces" , unidade: { label: "quadradinho", gramas: 6 } },
  { nome: "Biscoito recheado", kcal100g: 480, grupo: "Açúcares e doces" , unidade: { label: "unidade", gramas: 8 } },
  { nome: "Biscoito maisena", kcal100g: 443, grupo: "Açúcares e doces" , unidade: { label: "unidade", gramas: 5 } },
  { nome: "Bolo de chocolate", kcal100g: 375, grupo: "Açúcares e doces" , unidade: { label: "fatia", gramas: 80 } },
  { nome: "Bolo simples (sem cobertura)", kcal100g: 300, grupo: "Açúcares e doces" , unidade: { label: "fatia", gramas: 80 } },
  { nome: "Sorvete de creme", kcal100g: 207, grupo: "Açúcares e doces" , unidade: { label: "bola", gramas: 60 } },
  { nome: "Brigadeiro", kcal100g: 375, grupo: "Açúcares e doces" , unidade: { label: "unidade", gramas: 15 } },
  { nome: "Pudim de leite", kcal100g: 190, grupo: "Açúcares e doces" , unidade: { label: "fatia", gramas: 100 } },
  { nome: "Gelatina", kcal100g: 65, grupo: "Açúcares e doces" , unidade: { label: "pote", gramas: 110 } },

  // Bebidas
  { nome: "Refrigerante", kcal100g: 42, grupo: "Bebidas" , unidade: { label: "copo", gramas: 200 }, codigoBarras: "7894900011517" },
  { nome: "Refrigerante zero", kcal100g: 1, grupo: "Bebidas" , unidade: { label: "copo", gramas: 200 }, codigoBarras: "7894900011531" },
  { nome: "Suco de laranja natural", kcal100g: 37, grupo: "Bebidas" , unidade: { label: "copo", gramas: 200 } },
  { nome: "Suco de uva integral", kcal100g: 54, grupo: "Bebidas" , unidade: { label: "copo", gramas: 200 } },
  { nome: "Suco industrializado adoçado", kcal100g: 46, grupo: "Bebidas" , unidade: { label: "copo", gramas: 200 } },
  { nome: "Água de coco", kcal100g: 22, grupo: "Bebidas" , unidade: { label: "copo", gramas: 200 }, codigoBarras: "7891910000123" },
  { nome: "Café sem açúcar", kcal100g: 2, grupo: "Bebidas" , unidade: { label: "xícara", gramas: 50 } },
  { nome: "Café com leite e açúcar", kcal100g: 45, grupo: "Bebidas" , unidade: { label: "xícara", gramas: 150 } },
  { nome: "Chá sem açúcar", kcal100g: 1, grupo: "Bebidas" , unidade: { label: "xícara", gramas: 200 } },
  { nome: "Vitamina de banana (leite)", kcal100g: 78, grupo: "Bebidas" , unidade: { label: "copo", gramas: 250 } },
  { nome: "Cerveja pilsen", kcal100g: 41, grupo: "Bebidas" , unidade: { label: "lata", gramas: 350 } },
  { nome: "Vinho tinto seco", kcal100g: 85, grupo: "Bebidas" , unidade: { label: "taça", gramas: 150 } },
  { nome: "Achocolatado pronto", kcal100g: 65, grupo: "Bebidas" , unidade: { label: "caixinha", gramas: 200 }, codigoBarras: "7891000234567" },
  { nome: "Isotônico", kcal100g: 24, grupo: "Bebidas" , unidade: { label: "garrafa", gramas: 500 } },
  { nome: "Energético", kcal100g: 45, grupo: "Bebidas" , unidade: { label: "lata", gramas: 250 } },

  // Industrializados e fast food
  { nome: "Pizza de muçarela (fatia)", kcal100g: 266, grupo: "Industrializados" , unidade: { label: "fatia", gramas: 100 } },
  { nome: "Hambúrguer de carne (fast food)", kcal100g: 295, grupo: "Industrializados" , unidade: { label: "unidade", gramas: 90 } },
  { nome: "Cachorro-quente completo", kcal100g: 250, grupo: "Industrializados" , unidade: { label: "unidade", gramas: 150 } },
  { nome: "Coxinha frita", kcal100g: 290, grupo: "Industrializados" , unidade: { label: "unidade", gramas: 70 } },
  { nome: "Pastel frito (carne)", kcal100g: 320, grupo: "Industrializados" , unidade: { label: "unidade", gramas: 80 } },
  { nome: "Esfiha de carne", kcal100g: 280, grupo: "Industrializados" , unidade: { label: "unidade", gramas: 40 } },
  { nome: "Salgadinho de pacote (chips)", kcal100g: 536, grupo: "Industrializados" , unidade: { label: "pacote pequeno", gramas: 45 } },
  { nome: "Miojo (macarrão instantâneo)", kcal100g: 436, grupo: "Industrializados" , unidade: { label: "pacote", gramas: 80 }, codigoBarras: "7896102500122" },
  { nome: "Nuggets de frango", kcal100g: 296, grupo: "Industrializados" , unidade: { label: "unidade", gramas: 18 } },
  { nome: "Lasanha congelada pronta", kcal100g: 152, grupo: "Industrializados" , unidade: { label: "porção", gramas: 300 } },
  { nome: "Sanduíche natural (frango)", kcal100g: 210, grupo: "Industrializados" , unidade: { label: "unidade", gramas: 150 } },
  { nome: "Barra de cereal", kcal100g: 390, grupo: "Industrializados" , unidade: { label: "unidade", gramas: 25 }, codigoBarras: "7891000123456" },
  { nome: "Barra de proteína", kcal100g: 370, grupo: "Industrializados" , unidade: { label: "unidade", gramas: 50 }, codigoBarras: "7891000654321" },
  { nome: "Iogurte com frutas industrializado", kcal100g: 89, grupo: "Industrializados" , unidade: { label: "pote", gramas: 100 } },
  { nome: "Pão de hambúrguer", kcal100g: 280, grupo: "Industrializados" , unidade: { label: "unidade", gramas: 50 } },

  // Condimentos e molhos
  { nome: "Molho de tomate", kcal100g: 82, grupo: "Condimentos" , unidade: { label: "col. de sopa", gramas: 20 } },
  { nome: "Ketchup", kcal100g: 112, grupo: "Condimentos" , unidade: { label: "col. de sopa", gramas: 15 } },
  { nome: "Mostarda", kcal100g: 87, grupo: "Condimentos" , unidade: { label: "col. de sopa", gramas: 15 } },
  { nome: "Molho shoyu", kcal100g: 60, grupo: "Condimentos" , unidade: { label: "col. de sopa", gramas: 15 } },
  { nome: "Vinagrete", kcal100g: 35, grupo: "Condimentos" , unidade: { label: "col. de sopa", gramas: 20 } },
  { nome: "Molho branco (bechamel)", kcal100g: 130, grupo: "Condimentos" , unidade: { label: "col. de sopa", gramas: 20 } },
  { nome: "Molho barbecue", kcal100g: 172, grupo: "Condimentos" , unidade: { label: "col. de sopa", gramas: 17 } },
  { nome: "Azeitona verde", kcal100g: 145, grupo: "Condimentos" , unidade: { label: "unidade", gramas: 4 } },
];

// Índice por código de barras, montado uma única vez (evita recalcular a cada scan)
const TACO_POR_CODIGO = TACO.reduce((acc, f) => {
  if (f.codigoBarras) acc[f.codigoBarras] = f;
  return acc;
}, {});

function GlobalStyle() {
  return (
    <style>{`
      @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(12px);} to { opacity: 1; transform: translateY(0);} }
      @keyframes popIn { from { opacity: 0; transform: scale(0.95);} to { opacity: 1; transform: scale(1);} }
      .anim-page { animation: fadeSlideUp 0.3s ease both; }
      .anim-card { animation: popIn 0.25s ease both; }
      .btn-press { transition: transform 0.12s ease, opacity 0.12s ease; }
      .btn-press:active { transform: scale(0.96); }
      * { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif; }
    `}</style>
  );
}

function AnimatedNumber({ value, className }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current, to = value, start = performance.now(), duration = 450;
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick); else prev.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className={className}>{display}</span>;
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [signupData, setSignupData] = useState({ nome: "", email: "" });
  const [day, setDay] = useState({ meals: emptyMeals(), exercises: [] });
  const [page, setPage] = useState("login");
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const p = await window.storage.get("profile");
        if (p?.value) { setProfile(JSON.parse(p.value)); setPage("hoje"); }
      } catch (e) {}
      try {
        const d = await window.storage.get(`day:${todayKey()}`);
        if (d?.value) setDay(JSON.parse(d.value));
      } catch (e) {}
      try {
        const pr = await window.storage.get("premium");
        if (pr?.value === "1") setIsPremium(true);
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  const ativarPremium = useCallback(async () => {
    setIsPremium(true);
    try { await window.storage.set("premium", "1"); } catch (e) { console.error(e); }
  }, []);

  const saveProfile = useCallback(async (p) => {
    setProfile(p);
    try { await window.storage.set("profile", JSON.stringify(p)); } catch (e) { console.error(e); }
  }, []);

  const addFoodToMeal = useCallback((mealId, nome, gramas, label) => {
    const item = TACO.find((f) => f.nome === nome);
    const kcal = Math.round((item.kcal100g * gramas) / 100);
    const macros = macrosDoAlimento(kcal, item.grupo);
    const entry = { nome, gramas, kcal, label: label || `${gramas} g`, grupo: item.grupo, ...macros, id: Date.now() };
    setDay((d) => {
      const next = { ...d, meals: { ...d.meals, [mealId]: [...d.meals[mealId], entry] } };
      window.storage.set(`day:${todayKey()}`, JSON.stringify(next)).catch((e) => console.error(e));
      return next;
    });
  }, []);

  const aplicarCardapio = useCallback((mealId, itens) => {
    const novos = itens.map((i, idx) => {
      const macros = macrosDoAlimento(i.kcal, i.grupo);
      return { nome: i.nome, gramas: i.gramas, kcal: i.kcal, label: i.label, grupo: i.grupo, ...macros, id: Date.now() + idx };
    });
    setDay((d) => {
      const next = { ...d, meals: { ...d.meals, [mealId]: [...d.meals[mealId], ...novos] } };
      window.storage.set(`day:${todayKey()}`, JSON.stringify(next)).catch((e) => console.error(e));
      return next;
    });
  }, []);

  const aplicarSubstituicao = useCallback((s) => {
    const alvo = TACO.find((f) => f.nome === s.para);
    if (!alvo) return;
    setDay((d) => {
      const lista = d.meals[s.mealId];
      const idxItem = lista.findIndex((f) => f.nome === s.de);
      if (idxItem === -1) return d;
      const antigo = lista[idxItem];
      const macros = macrosDoAlimento(s.kcalPara, alvo.grupo);
      const qtdUnidade = alvo.unidade ? Math.max(1, Math.round(antigo.gramas / alvo.unidade.gramas)) : null;
      const novo = {
        ...antigo,
        nome: alvo.nome,
        grupo: alvo.grupo,
        kcal: s.kcalPara,
        label: qtdUnidade ? `${qtdUnidade} ${alvo.unidade.label}${qtdUnidade !== 1 ? "s" : ""}` : `${antigo.gramas} g`,
        ...macros,
      };
      const novaLista = [...lista];
      novaLista[idxItem] = novo;
      const next = { ...d, meals: { ...d.meals, [s.mealId]: novaLista } };
      window.storage.set(`day:${todayKey()}`, JSON.stringify(next)).catch((e) => console.error(e));
      return next;
    });
  }, []);

  const removeFoodFromMeal = useCallback((mealId, id) => {
    setDay((d) => {
      const next = { ...d, meals: { ...d.meals, [mealId]: d.meals[mealId].filter((f) => f.id !== id) } };
      window.storage.set(`day:${todayKey()}`, JSON.stringify(next)).catch((e) => console.error(e));
      return next;
    });
  }, []);

  const salvarTreino = useCallback((sessao) => {
    setDay((d) => {
      const next = { ...d, exercises: [...d.exercises, sessao] };
      window.storage.set(`day:${todayKey()}`, JSON.stringify(next)).catch((e) => console.error(e));
      return next;
    });
  }, []);

  const removeExercise = useCallback((id) => {
    setDay((d) => {
      const next = { ...d, exercises: d.exercises.filter((e) => e.id !== id) };
      window.storage.set(`day:${todayKey()}`, JSON.stringify(next)).catch((e) => console.error(e));
      return next;
    });
  }, []);

  const registrarPeso = useCallback(async (novoPeso) => {
    setProfile((p) => {
      const historico = p.pesoHistorico || [];
      const hoje = todayKey();
      const semHoje = historico.filter((h) => h.date !== hoje);
      const atualizado = { ...p, peso: novoPeso, pesoHistorico: [...semHoje, { date: hoje, peso: novoPeso }].slice(-30) };
      window.storage.set("profile", JSON.stringify(atualizado)).catch((e) => console.error(e));
      return atualizado;
    });
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <Flame className="w-6 h-6 animate-pulse" style={{ color: ORANGE }} />
    </div>;
  }

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      <GlobalStyle />
      {page === "login" && (
        <LoginPage
          hasProfile={!!profile}
          onEntrar={() => setPage(profile ? "hoje" : "cadastro")}
          onCriarConta={() => setPage("cadastro")}
        />
      )}
      {page === "cadastro" && (
        <CadastroPage
          initial={signupData}
          onVoltar={() => setPage("login")}
          onContinuar={(dados) => { setSignupData(dados); setPage("medidas"); }}
        />
      )}
      {page === "medidas" && (
        <MedidasPage
          signupData={signupData}
          initial={profile}
          onVoltar={() => setPage(profile ? "perfil" : "cadastro")}
          onSalvar={async (dados) => {
            const completo = { ...signupData, ...dados, pesoHistorico: profile?.pesoHistorico || [{ date: todayKey(), peso: dados.peso }] };
            await saveProfile(completo);
            setPage("hoje");
          }}
        />
      )}
      {profile && ["hoje", "comida", "propostas", "treino", "perfil"].includes(page) && (
        <>
          {page === "hoje" && <Hoje profile={profile} day={day} />}
          {page === "comida" && <Comida day={day} addFoodToMeal={addFoodToMeal} removeFoodFromMeal={removeFoodFromMeal} onConcluir={() => setPage("hoje")} />}
          {page === "propostas" && (
            <Propostas
              profile={profile}
              day={day}
              isPremium={isPremium}
              onAtivarPremium={ativarPremium}
              aplicarCardapio={aplicarCardapio}
              aplicarSubstituicao={aplicarSubstituicao}
            />
          )}
          {page === "treino" && <Treino profile={profile} day={day} salvarTreino={salvarTreino} removeExercise={removeExercise} />}
          {page === "perfil" && (
            <Perfil
              profile={profile}
              onEditar={() => setPage("medidas")}
              onSalvarPeso={registrarPeso}
              onSair={() => setPage("login")}
            />
          )}
          <BottomNav page={page} setPage={setPage} />
        </>
      )}
    </div>
  );
}

function BottomNav({ page, setPage }) {
  const tabs = [
    { id: "hoje", label: "Hoje", icon: Home },
    { id: "comida", label: "Comida", icon: UtensilsCrossed },
    { id: "propostas", label: "Propostas", icon: Sparkles },
    { id: "treino", label: "Treino", icon: Dumbbell },
    { id: "perfil", label: "Perfil", icon: UserRound },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-40" style={{ borderColor: BORDER }}>
      <div className="max-w-2xl mx-auto grid grid-cols-5">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setPage(t.id)} aria-current={page === t.id ? "page" : undefined}
            className="btn-press flex flex-col items-center gap-1 py-3 text-xs font-medium"
            style={{ color: page === t.id ? DARK : MUTED }}>
            <t.icon className="w-5 h-5" strokeWidth={page === t.id ? 2.4 : 2} />
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}


function TextField({ label, ...props }) {
  return (
    <label className="block">
      <span className="block text-sm text-[#3A423C] mb-1.5">{label}</span>
      <input {...props}
        className="w-full bg-white border rounded-xl px-4 py-3 text-[15px] text-[#16211C] focus:outline-none focus:ring-2"
        style={{ borderColor: BORDER, "--tw-ring-color": ORANGE }} />
    </label>
  );
}

function PasswordField({ label, value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      <span className="block text-sm text-[#3A423C] mb-1.5">{label}</span>
      <div className="relative">
        <input type={show ? "text" : "password"} value={value} onChange={onChange}
          className="w-full bg-white border rounded-xl px-4 py-3 text-[15px] text-[#16211C] focus:outline-none focus:ring-2"
          style={{ borderColor: BORDER }} />
        <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Ocultar senha" : "Mostrar senha"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8F87]">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </label>
  );
}

function PillButton({ active, onClick, children }) {
  return (
    <button onClick={onClick} className="btn-press px-4 py-2.5 rounded-full text-sm font-medium border"
      style={active
        ? { background: DARK, color: "white", borderColor: DARK }
        : { background: "white", color: "#3A423C", borderColor: BORDER }}>
      {children}
    </button>
  );
}

function OrangeButton({ children, onClick, disabled, className = "" }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`btn-press w-full rounded-full py-4 text-[15px] font-semibold text-white disabled:opacity-40 ${className}`}
      style={{ background: ORANGE }}>
      {children}
    </button>
  );
}

// ---------- Login ----------
function LoginPage({ hasProfile, onEntrar, onCriarConta }) {
  const [email, setEmail] = useState(hasProfile ? "" : "");
  const [senha, setSenha] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const abrirRecuperacao = () => {
    setForgotEmail(email);
    setForgotSent(false);
    setShowForgot(true);
  };

  const enviarRecuperacao = () => {
    if (!forgotEmail) return;
    // Sem backend de autenticação: simula o envio localmente e confirma para o usuário.
    setForgotSent(true);
  };

  return (
    <div className="min-h-screen anim-page">
      <div className="rounded-b-[2rem] px-6 pt-14 pb-14" style={{ background: DARK }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: ORANGE }}>
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-lg leading-none">medida</div>
            <div className="text-white/50 text-[10px] tracking-widest mt-1">COMIDA · TREINO · PROGRESSO</div>
          </div>
        </div>
        <h1 className="text-white text-3xl font-bold leading-tight">Cada refeição é<br />uma medida.</h1>
        <p className="text-white/60 text-sm mt-2">Entre para continuar de onde você parou.</p>
      </div>

      <div className="max-w-2xl mx-auto px-6 -mt-6 relative">
        <div className="bg-white rounded-3xl p-6 space-y-4 shadow-xl anim-card">
          <TextField label="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
          <PasswordField label="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} />
          <div className="text-right">
            <button onClick={abrirRecuperacao} className="btn-press text-sm font-medium" style={{ color: TEAL }}>
              Esqueci minha senha
            </button>
          </div>
          <OrangeButton onClick={onEntrar}>Entrar</OrangeButton>
          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1" style={{ background: BORDER }} />
            <span className="text-xs text-[#8A8F87]">ou entre com</span>
            <div className="h-px flex-1" style={{ background: BORDER }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={onEntrar} aria-label="Entrar com Google"
              className="btn-press border rounded-xl py-3 text-sm font-medium" style={{ borderColor: BORDER }}>
              Google
            </button>
            <button onClick={onEntrar} aria-label="Entrar com Apple"
              className="btn-press border rounded-xl py-3 text-sm font-medium" style={{ borderColor: BORDER }}>
              Apple
            </button>
          </div>
          <p className="text-center text-sm text-[#3A423C] pt-1">
            Ainda não tem conta? <button onClick={onCriarConta} className="font-bold underline">Criar conta</button>
          </p>
        </div>
      </div>

      {showForgot && (
        <Modal title="Recuperar senha" onClose={() => setShowForgot(false)}>
          {forgotSent ? (
            <div className="space-y-4">
              <p className="text-sm text-[#3A423C]">
                Se <b>{forgotEmail}</b> estiver cadastrado, enviamos um link de recuperação em instantes.
              </p>
              <OrangeButton onClick={() => setShowForgot(false)}>Entendi</OrangeButton>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-[#8A8F87]">Informe seu e-mail para receber o link de recuperação.</p>
              <TextField label="E-mail" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="voce@email.com" />
              <OrangeButton disabled={!forgotEmail} onClick={enviarRecuperacao}>Enviar link</OrangeButton>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ---------- Criar conta (passo 1/3) ----------
function CadastroPage({ initial, onVoltar, onContinuar }) {
  const [nome, setNome] = useState(initial?.nome || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [senha, setSenha] = useState("");
  const [aceite, setAceite] = useState(false);

  const forca = senha.length === 0 ? 0 : senha.length < 6 ? 1 : senha.length < 10 ? 2 : 3;
  const forcaLabel = ["", "Fraca", "Boa", "Forte"][forca];
  const forcaCor = ["", "#EF4444", TEAL, TEAL][forca];
  const podeContinuar = nome && email && senha.length >= 8 && aceite;

  return (
    <div className="min-h-screen anim-page px-6 pt-6 pb-12 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onVoltar} aria-label="Voltar" className="btn-press w-10 h-10 rounded-full bg-white border flex items-center justify-center" style={{ borderColor: BORDER }}>
          <ChevronLeft className="w-5 h-5" style={{ color: DARK }} />
        </button>
        <span className="text-xs text-[#8A8F87]">Passo 1 de 3</span>
      </div>

      <h1 className="text-3xl font-bold" style={{ color: DARK }}>Criar sua conta</h1>
      <p className="text-sm text-[#8A8F87] mt-1 mb-5">Leva menos de um minuto. Depois ajustamos tudo ao seu objetivo.</p>

      <div className="flex gap-1.5 mb-6">
        <div className="h-1.5 flex-1 rounded-full" style={{ background: ORANGE }} />
        <div className="h-1.5 flex-1 rounded-full" style={{ background: BORDER }} />
        <div className="h-1.5 flex-1 rounded-full" style={{ background: BORDER }} />
      </div>

      <div className="space-y-4">
        <TextField label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
        <TextField label="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
        <PasswordField label="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} />
        {senha.length > 0 && (
          <div>
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-1.5 flex-1 rounded-full" style={{ background: i < forca ? forcaCor : BORDER }} />
              ))}
            </div>
            <div className="flex justify-between text-xs text-[#8A8F87] mt-1">
              <span>Use 8 caracteres ou mais, com um número.</span>
              <span style={{ color: forcaCor }}>{forcaLabel}</span>
            </div>
          </div>
        )}
        <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
          <button type="button" onClick={() => setAceite(!aceite)} aria-pressed={aceite} aria-label="Aceitar termos de uso e política de privacidade"
            className="btn-press w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: aceite ? DARK : "white", border: `1px solid ${aceite ? DARK : BORDER}` }}>
            {aceite && <Check className="w-3.5 h-3.5 text-white" />}
          </button>
          <span className="text-sm text-[#3A423C]">Li e aceito os <b>Termos de uso</b> e a <b>Política de privacidade</b>.</span>
        </label>
      </div>

      <div className="mt-7">
        <OrangeButton disabled={!podeContinuar} onClick={() => onContinuar({ nome, email })}>Criar conta</OrangeButton>
        <p className="text-center text-sm text-[#3A423C] mt-4">
          Já tem conta? <button onClick={onVoltar} className="font-bold underline">Entrar</button>
        </p>
      </div>
    </div>
  );
}

// ---------- Suas medidas (passo 2/3) ----------
function MedidasPage({ signupData, initial, onVoltar, onSalvar }) {
  const [form, setForm] = useState(initial || {
    sexo: "F", altura: 168, peso: 64.5, idade: 29, cintura: 74,
    atividade: "leve", objetivo: "perder",
  });

  const preview = useMemo(() => calcularMetas(form), [form]);

  return (
    <div className="min-h-screen anim-page px-6 pt-6 pb-40 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onVoltar} aria-label="Voltar" className="btn-press w-10 h-10 rounded-full bg-white border flex items-center justify-center" style={{ borderColor: BORDER }}>
          <ChevronLeft className="w-5 h-5" style={{ color: DARK }} />
        </button>
        <span className="text-xs text-[#8A8F87]">Passo 2 de 3</span>
      </div>

      <h1 className="text-3xl font-bold" style={{ color: DARK }}>Suas medidas</h1>
      <p className="text-sm text-[#8A8F87] mt-1 mb-6">Você pode ajustar tudo depois no seu perfil.</p>

      <Section2 title="SEXO BIOLÓGICO">
        <div className="flex gap-2">
          {["Feminino", "Masculino", "Outro"].map((s) => {
            const id = s === "Feminino" ? "F" : s === "Masculino" ? "M" : "Outro";
            return <PillButton key={s} active={form.sexo === id} onClick={() => setForm({ ...form, sexo: id })}>{s}</PillButton>;
          })}
        </div>
      </Section2>

      <Section2 title="ALTURA" right={`${form.altura} cm`}>
        <input type="range" min={140} max={210} value={form.altura}
          onChange={(e) => setForm({ ...form, altura: Number(e.target.value) })}
          className="w-full" style={{ accentColor: ORANGE }} />
      </Section2>

      <Section2 title="PESO ATUAL" right={`${form.peso} kg`}>
        <input type="range" min={40} max={150} step={0.5} value={form.peso}
          onChange={(e) => setForm({ ...form, peso: Number(e.target.value) })}
          className="w-full" style={{ accentColor: ORANGE }} />
      </Section2>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-2xl border p-4" style={{ borderColor: BORDER }}>
          <div className="text-xs text-[#8A8F87] mb-2">IDADE</div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold" style={{ color: DARK }}>{form.idade}</span>
            <div className="flex gap-1.5">
              <button onClick={() => setForm({ ...form, idade: Math.max(14, form.idade - 1) })} aria-label="Diminuir idade"
                className="btn-press w-7 h-7 rounded-full border flex items-center justify-center" style={{ borderColor: BORDER }}>
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setForm({ ...form, idade: form.idade + 1 })} aria-label="Aumentar idade"
                className="btn-press w-7 h-7 rounded-full flex items-center justify-center text-white" style={{ background: DARK }}>
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border p-4" style={{ borderColor: BORDER }}>
          <div className="text-xs text-[#8A8F87] mb-2">CINTURA</div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold" style={{ color: DARK }}>{form.cintura}<span className="text-sm font-normal">cm</span></span>
            <div className="flex gap-1.5">
              <button onClick={() => setForm({ ...form, cintura: Math.max(40, form.cintura - 1) })} aria-label="Diminuir cintura"
                className="btn-press w-7 h-7 rounded-full border flex items-center justify-center" style={{ borderColor: BORDER }}>
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setForm({ ...form, cintura: form.cintura + 1 })} aria-label="Aumentar cintura"
                className="btn-press w-7 h-7 rounded-full flex items-center justify-center text-white" style={{ background: DARK }}>
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <Section2 title="ROTINA DE ATIVIDADE">
        <div className="flex flex-wrap gap-2">
          {FATORES_ATIVIDADE.map((f) => (
            <PillButtonOrange key={f.id} active={form.atividade === f.id} onClick={() => setForm({ ...form, atividade: f.id })}>{f.label}</PillButtonOrange>
          ))}
        </div>
      </Section2>

      <Section2 title="OBJETIVO">
        <div className="grid grid-cols-3 gap-2">
          {OBJETIVOS.map((o) => (
            <button key={o.id} onClick={() => setForm({ ...form, objetivo: o.id })}
              className="btn-press rounded-xl border-2 p-3 text-left"
              style={{ borderColor: form.objetivo === o.id ? DARK : BORDER }}>
              <div className="text-sm font-semibold" style={{ color: DARK }}>{o.label}</div>
              <div className="text-xs text-[#8A8F87]">{o.desc}</div>
            </button>
          ))}
        </div>
      </Section2>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t rounded-t-3xl px-6 pt-4 pb-6 max-w-2xl mx-auto" style={{ borderColor: BORDER }}>
        <div className="flex justify-between items-end mb-3">
          <div>
            <div className="text-xs text-[#8A8F87]">SUA META DIÁRIA</div>
            <div className="flex items-baseline gap-1">
              <AnimatedNumber value={preview.metaDiaria} className="text-3xl font-bold" />
              <span className="text-sm text-[#8A8F87]">kcal</span>
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: preview.metaLimitada ? ORANGE : MUTED }}>
              {preview.deficitReal > 0
                ? `déficit de ${preview.deficitReal} kcal/dia ≈ ${Math.abs(preview.kgSemanaReal).toFixed(2)} kg/sem`
                : preview.deficitReal < 0
                  ? `superávit de ${Math.abs(preview.deficitReal)} kcal/dia`
                  : "manutenção do peso"}
              {preview.metaLimitada && " · limitada por segurança"}
            </div>
          </div>
          <div className="text-xs text-[#8A8F87] text-right">
            P {preview.macrosAlvo.p} g · C {preview.macrosAlvo.c} g · G {preview.macrosAlvo.g} g
          </div>
        </div>
        <OrangeButton onClick={() => onSalvar(form)}>Continuar</OrangeButton>
      </div>
    </div>
  );
}

function Section2({ title, right, children }) {
  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-2.5">
        <span className="text-xs font-semibold tracking-wide text-[#8A8F87]">{title}</span>
        {right && <span className="text-sm font-bold px-2 py-0.5 rounded-md text-white" style={{ background: ORANGE }}>{right}</span>}
      </div>
      {children}
    </div>
  );
}

function PillButtonOrange({ active, onClick, children }) {
  return (
    <button onClick={onClick} className="btn-press px-4 py-2.5 rounded-full text-sm font-medium border"
      style={active
        ? { background: ORANGE, color: "white", borderColor: ORANGE }
        : { background: "white", color: "#3A423C", borderColor: BORDER }}>
      {children}
    </button>
  );
}


function GaugeArco({ pct, cor }) {
  const totalTicks = 44;
  const filledTicks = Math.round(Math.min(1, Math.max(0, pct)) * totalTicks);
  const radius = 82, cx = 100, cy = 100;
  return (
    <svg viewBox="0 0 200 108" className="w-full">
      {Array.from({ length: totalTicks + 1 }).map((_, i) => {
        const angle = Math.PI - (i / totalTicks) * Math.PI;
        const x1 = cx + (radius - 10) * Math.cos(angle);
        const y1 = cy - (radius - 10) * Math.sin(angle);
        const x2 = cx + radius * Math.cos(angle);
        const y2 = cy - radius * Math.sin(angle);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={i <= filledTicks ? cor : "#E7DED6"} strokeWidth={3.2} strokeLinecap="round" />;
      })}
    </svg>
  );
}

function Hoje({ profile, day }) {
  const { metaDiaria, macrosAlvo, deficitReal, kgSemanaReal, metaLimitada } = useMemo(() => calcularMetas(profile), [profile]);
  const todasRefeicoes = useMemo(() => Object.values(day.meals).flat(), [day.meals]);
  const consumido = useMemo(() => todasRefeicoes.reduce((s, f) => s + f.kcal, 0), [todasRefeicoes]);
  const queimadoExercicio = useMemo(() => day.exercises.reduce((s, e) => s + e.kcal, 0), [day.exercises]);
  // Consumo líquido = o que entrou menos o que o treino queimou
  const liquido = consumido - queimadoExercicio;
  const restam = metaDiaria - liquido;
  const pct = metaDiaria > 0 ? liquido / metaDiaria : 0;
  const corGauge = restam >= 0 ? ORANGE : "#EF4444";

  const macrosConsumidos = useMemo(() => todasRefeicoes.reduce((acc, f) => ({
    p: acc.p + (f.p || 0), c: acc.c + (f.c || 0), g: acc.g + (f.g || 0),
  }), { p: 0, c: 0, g: 0 }), [todasRefeicoes]);
  const totalMacroKcalAlvo = macrosAlvo.p * 4 + macrosAlvo.c * 4 + macrosAlvo.g * 9;
  const statusMacro = consumido === 0 ? "sem registros" : consumido < metaDiaria * 0.85 ? "abaixo do alvo" : consumido > metaDiaria * 1.1 ? "acima do alvo" : "no alvo";

  const stats = useWeeklyStats();
  const historico = (profile.pesoHistorico || []).slice(-7);
  const chartData = historico.map((h) => ({ dia: new Date(h.date).toLocaleDateString("pt-BR", { weekday: "short" })[0].toUpperCase(), peso: h.peso }));
  const deltaPeso = historico.length > 1 ? (historico[historico.length - 1].peso - historico[0].peso) : 0;

  return (
    <div className="pb-24">
      <header className="max-w-2xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between anim-page">
        <div>
          <div className="text-xs tracking-wide text-[#8A8F87]">{formatDataLonga()}</div>
          <h1 className="text-2xl font-bold mt-0.5" style={{ color: DARK }}>Seus resultados</h1>
        </div>
        <button className="btn-press flex items-center gap-1 bg-white border rounded-full px-3 py-1.5 text-xs font-medium" style={{ borderColor: BORDER, color: DARK }}>
          Semana <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-6 space-y-4">
        <div className="anim-card bg-white rounded-3xl p-6 shadow-sm">
          <GaugeArco pct={pct} cor={corGauge} />
          <div className="text-center -mt-8">
            <AnimatedNumber value={liquido} className="text-4xl font-bold block" />
            <span className="text-sm text-[#8A8F87]">de {metaDiaria} kcal</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-6 pt-5 border-t" style={{ borderColor: BORDER }}>
            <div className="text-center">
              <div className="text-[10px] tracking-wide text-[#8A8F87]">CONSUMIDO</div>
              <div className="text-lg font-bold" style={{ color: DARK }}>{consumido}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] tracking-wide text-[#8A8F87]">TREINO</div>
              <div className="text-lg font-bold" style={{ color: TEAL }}>-{queimadoExercicio}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] tracking-wide text-[#8A8F87]">RESTAM</div>
              <div className="text-lg font-bold" style={{ color: corGauge }}>{restam}</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t text-xs text-[#8A8F87] flex justify-between items-center" style={{ borderColor: BORDER }}>
            <span>
              Meta = gasto − {deficitReal} kcal/dia
              {deficitReal > 0 && ` (≈ ${Math.abs(kgSemanaReal).toFixed(2)} kg/sem)`}
            </span>
            {metaLimitada && (
              <span className="font-medium" style={{ color: ORANGE }}>limitada por segurança</span>
            )}
          </div>
        </div>

        <div className="anim-card bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs tracking-wide text-[#8A8F87] font-semibold">MACROS DE HOJE</span>
            <span className="text-xs font-medium" style={{ color: statusMacro === "no alvo" ? TEAL : "#8A8F87" }}>{statusMacro}</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[#EFECE4] overflow-hidden flex">
            {totalMacroKcalAlvo > 0 && (
              <>
                <div style={{ width: `${Math.min(100, (macrosConsumidos.p * 4 / totalMacroKcalAlvo) * 100)}%`, background: TEAL }} />
                <div style={{ width: `${Math.min(100, (macrosConsumidos.c * 4 / totalMacroKcalAlvo) * 100)}%`, background: PURPLE }} />
                <div style={{ width: `${Math.min(100, (macrosConsumidos.g * 9 / totalMacroKcalAlvo) * 100)}%`, background: GOLD }} />
              </>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <MacroLegend cor={TEAL} nome="Proteína" atual={macrosConsumidos.p} alvo={macrosAlvo.p} />
            <MacroLegend cor={PURPLE} nome="Carbo" atual={macrosConsumidos.c} alvo={macrosAlvo.c} />
            <MacroLegend cor={GOLD} nome="Gordura" atual={macrosConsumidos.g} alvo={macrosAlvo.g} />
          </div>
        </div>

        <div className="anim-card bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs tracking-wide text-[#8A8F87] font-semibold">PESO · ÚLTIMOS 7 DIAS</span>
            {historico.length > 1 && (
              <span className="text-xs font-bold flex items-center gap-1" style={{ color: deltaPeso <= 0 ? TEAL : "#EF4444" }}>
                {deltaPeso <= 0 ? "▼" : "▲"} {Math.abs(deltaPeso).toFixed(1)} kg
              </span>
            )}
          </div>
          {chartData.length >= 2 ? (
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
                  <Line type="monotone" dataKey="peso" stroke={TEAL} strokeWidth={2.5} dot={{ r: 3, fill: TEAL }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-[#8A8F87] py-4">Registre seu peso no Perfil para ver a evolução aqui.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="anim-card bg-white rounded-3xl p-5 shadow-sm">
            <div className="text-xs tracking-wide text-[#8A8F87] font-semibold mb-1">SEQUÊNCIA</div>
            <div className="text-2xl font-bold" style={{ color: DARK }}>{stats.streak} <span className="text-sm font-normal text-[#8A8F87]">dias</span></div>
          </div>
          <div className="anim-card bg-white rounded-3xl p-5 shadow-sm">
            <div className="text-xs tracking-wide text-[#8A8F87] font-semibold mb-1">TREINOS</div>
            <div className="text-2xl font-bold" style={{ color: DARK }}>{stats.treinosSemana}<span className="text-sm font-normal text-[#8A8F87]">/5</span></div>
          </div>
        </div>
      </main>
    </div>
  );
}

function MacroLegend({ cor, nome, atual, alvo }) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full" style={{ background: cor }} />
        <span className="text-xs text-[#8A8F87]">{nome}</span>
      </div>
      <div className="text-sm font-bold mt-0.5" style={{ color: DARK }}>{atual}g<span className="text-xs font-normal text-[#8A8F87]">/{alvo}</span></div>
    </div>
  );
}

function useWeeklyStats() {
  const [stats, setStats] = useState({ streak: 0, treinosSemana: 0 });
  useEffect(() => {
    let cancelado = false;
    (async () => {
      const dias = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - i);
        return d.toISOString().slice(0, 10);
      });
      // Busca os 30 dias em paralelo (em vez de sequencialmente) e só então
      // aplica a lógica de sequência, já que cada dia é independente dos outros.
      const resultados = await Promise.all(
        dias.map((key) => window.storage.get(`day:${key}`).catch(() => null))
      );
      if (cancelado) return;

      let streak = 0, treinosSemana = 0;
      for (let i = 0; i < resultados.length; i++) {
        const res = resultados[i];
        if (!res?.value) { if (i === 0) continue; break; }
        let data;
        try { data = JSON.parse(res.value); } catch (e) { if (i === 0) continue; break; }
        const totalFoods = Object.values(data.meals || {}).reduce((s, arr) => s + arr.length, 0);
        const hasActivity = totalFoods > 0 || (data.exercises || []).length > 0;
        if (i < 7 && (data.exercises || []).length > 0) treinosSemana++;
        if (hasActivity) streak++; else break;
      }
      setStats({ streak, treinosSemana });
    })();
    return () => { cancelado = true; };
  }, []);
  return stats;
}


function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="anim-card bg-white rounded-3xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold" style={{ color: DARK }}>{title}</h3>
          <button onClick={onClose} aria-label="Fechar" className="btn-press w-8 h-8 rounded-full bg-[#F2F0EA] flex items-center justify-center">
            <X className="w-4 h-4" style={{ color: DARK }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Comida({ day, addFoodToMeal, removeFoodFromMeal, onConcluir }) {
  const [mealId, setMealId] = useState("cafe");
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState(null);
  const [modo, setModo] = useState("gramas");
  const [qtd, setQtd] = useState(100);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanCodigo, setScanCodigo] = useState("");
  const [scanErro, setScanErro] = useState("");

  const filtrados = useMemo(
    () => (busca ? TACO.filter((f) => f.nome.toLowerCase().includes(busca.toLowerCase())).slice(0, 30) : []),
    [busca]
  );
  const itensDaRefeicao = day.meals[mealId];
  const subtotal = itensDaRefeicao.reduce((s, f) => s + f.kcal, 0);
  const macrosSubtotal = itensDaRefeicao.reduce((acc, f) => ({ p: acc.p + (f.p || 0), c: acc.c + (f.c || 0), g: acc.g + (f.g || 0) }), { p: 0, c: 0, g: 0 });
  const itemSelecionado = selecionado ? TACO.find((f) => f.nome === selecionado) : null;
  const temUnidade = !!itemSelecionado?.unidade;
  const mealLabel = MEAL_TYPES.find((m) => m.id === mealId).label.toLowerCase();

  const abrirSelecao = (nome) => {
    const item = TACO.find((f) => f.nome === nome);
    setSelecionado(nome);
    if (item.unidade) { setModo("unidade"); setQtd(1); } else { setModo("gramas"); setQtd(100); }
  };

  const buscarPorCodigo = () => {
    const codigo = scanCodigo.trim();
    if (!codigo) return;
    const encontrado = TACO_POR_CODIGO[codigo];
    if (!encontrado) {
      setScanErro("Código não encontrado. Tente buscar o alimento pelo nome.");
      return;
    }
    setScanOpen(false);
    setScanCodigo("");
    setScanErro("");
    abrirSelecao(encontrado.nome);
  };

  const gramasFinal = modo === "unidade" && itemSelecionado ? qtd * itemSelecionado.unidade.gramas : qtd;
  const rotuloFinal = modo === "unidade" && itemSelecionado ? `${qtd} ${itemSelecionado.unidade.label}${qtd !== 1 ? "s" : ""}` : `${qtd} g`;
  const kcalPreview = itemSelecionado ? Math.round((itemSelecionado.kcal100g * gramasFinal) / 100) : 0;

  const maxKcalBar = Math.max(subtotal, 400);

  return (
    <div className="pb-40">
      <header className="max-w-2xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between anim-page">
        <div>
          <div className="text-xs tracking-wide text-[#8A8F87]">{formatDataLonga()}</div>
          <h1 className="text-2xl font-bold mt-0.5" style={{ color: DARK }}>Registrar refeição</h1>
        </div>
        <button onClick={() => { setScanErro(""); setScanCodigo(""); setScanOpen(true); }} aria-label="Escanear código de barras"
          className="btn-press w-10 h-10 rounded-full flex items-center justify-center" style={{ background: DARK }}>
          <ScanLine className="w-[18px] h-[18px] text-white" />
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-6 space-y-4">
        <div className="bg-[#EFECE4] rounded-full p-1 flex anim-card">
          {MEAL_TYPES.map((m) => (
            <button key={m.id} onClick={() => setMealId(m.id)}
              className="btn-press flex-1 py-2.5 rounded-full text-sm font-semibold"
              style={mealId === m.id ? { background: "white", color: DARK, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" } : { color: "#8A8F87" }}>
              {m.label}
            </button>
          ))}
        </div>

        <div className="relative anim-card">
          <Search className="w-[18px] h-[18px] text-[#8A8F87] absolute left-4 top-1/2 -translate-y-1/2" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar alimento ou marca"
            className="w-full bg-white border rounded-2xl pl-11 pr-4 py-3.5 text-[15px] text-[#16211C] focus:outline-none focus:ring-2"
            style={{ borderColor: BORDER }} />
        </div>

        {busca && (
          <div className="anim-card bg-white rounded-2xl border divide-y" style={{ borderColor: BORDER }}>
            {filtrados.length === 0 && <p className="text-sm text-[#8A8F87] py-6 text-center">Nenhum alimento encontrado.</p>}
            {filtrados.map((f) => (
              <button key={f.nome} onClick={() => abrirSelecao(f.nome)}
                className="btn-press w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#FAFAF7]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full shrink-0" style={{ background: thumbColor(f.nome) }} />
                  <div>
                    <div className="text-sm font-medium" style={{ color: DARK }}>{f.nome}</div>
                    <div className="text-xs text-[#8A8F87]">{f.grupo}{f.unidade ? ` · por ${f.unidade.label}` : ""}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8A8F87]">{f.kcal100g} kcal/100g</span>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ background: ORANGE }}>
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {!busca && (
          <div className="anim-card">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs tracking-wide text-[#8A8F87] font-semibold">
                NO SEU {mealLabel.toUpperCase()} · {itensDaRefeicao.length} {itensDaRefeicao.length === 1 ? "ITEM" : "ITENS"}
              </span>
              <span className="text-sm font-bold" style={{ color: DARK }}>{subtotal} kcal</span>
            </div>
            {itensDaRefeicao.length === 0 && (
              <div className="bg-white rounded-2xl border p-6 text-center" style={{ borderColor: BORDER }}>
                <p className="text-sm text-[#8A8F87]">Nenhum item ainda. Use a busca acima para adicionar.</p>
              </div>
            )}
            <div className="space-y-2">
              {itensDaRefeicao.map((f) => (
                <div key={f.id} className="bg-white rounded-2xl border p-3 flex items-center justify-between" style={{ borderColor: BORDER }}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full shrink-0" style={{ background: thumbColor(f.nome) }} />
                    <div>
                      <div className="text-sm font-medium" style={{ color: DARK }}>{f.nome}</div>
                      <div className="text-xs text-[#8A8F87]">{f.label} · {f.kcal} kcal</div>
                    </div>
                  </div>
                  <button onClick={() => removeFoodFromMeal(mealId, f.id)} aria-label={`Remover ${f.nome}`}
                    className="btn-press w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0" style={{ background: DARK }}>
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-16 left-0 right-0 bg-white border-t px-6 pt-3 pb-4 max-w-2xl mx-auto" style={{ borderColor: BORDER }}>
        <div className="flex justify-between text-xs text-[#8A8F87] mb-1.5">
          <span>Proteína {macrosSubtotal.p} g · Carbo {macrosSubtotal.c} g · Gordura {macrosSubtotal.g} g</span>
          <span className="font-bold" style={{ color: DARK }}>{subtotal} kcal</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[#EFECE4] overflow-hidden flex mb-3">
          <div style={{ width: `${Math.min(100, (macrosSubtotal.p * 4 / maxKcalBar) * 100)}%`, background: TEAL }} />
          <div style={{ width: `${Math.min(100, (macrosSubtotal.c * 4 / maxKcalBar) * 100)}%`, background: PURPLE }} />
          <div style={{ width: `${Math.min(100, (macrosSubtotal.g * 9 / maxKcalBar) * 100)}%`, background: GOLD }} />
        </div>
        <OrangeButton onClick={onConcluir}>Concluir {mealLabel}</OrangeButton>
      </div>

      {selecionado && (
        <Modal title={selecionado} onClose={() => setSelecionado(null)}>
          {temUnidade && (
            <div className="flex gap-2">
              <button onClick={() => { setModo("unidade"); setQtd(1); }}
                className="btn-press flex-1 rounded-xl py-2.5 text-xs font-semibold border capitalize"
                style={modo === "unidade" ? { background: `${ORANGE}14`, borderColor: ORANGE, color: ORANGE } : { borderColor: BORDER, color: "#8A8F87" }}>
                {itemSelecionado.unidade.label}
              </button>
              <button onClick={() => { setModo("gramas"); setQtd(itemSelecionado.unidade.gramas); }}
                className="btn-press flex-1 rounded-xl py-2.5 text-xs font-semibold border"
                style={modo === "gramas" ? { background: `${ORANGE}14`, borderColor: ORANGE, color: ORANGE } : { borderColor: BORDER, color: "#8A8F87" }}>
                Gramas
              </button>
            </div>
          )}
          <TextField type="number" label={modo === "unidade" ? `Quantidade (${itemSelecionado.unidade.label}s)` : "Quantidade (g)"}
            value={qtd} onChange={(e) => setQtd(Number(e.target.value))} />
          <div className="rounded-xl px-4 py-3 flex justify-between items-center" style={{ background: "#F7F5EF" }}>
            <span className="text-xs text-[#8A8F87]">{modo === "unidade" ? `≈ ${gramasFinal} g` : rotuloFinal}</span>
            <span className="text-sm font-bold" style={{ color: DARK }}>{kcalPreview} kcal</span>
          </div>
          <OrangeButton onClick={() => { addFoodToMeal(mealId, selecionado, gramasFinal, rotuloFinal); setSelecionado(null); }}>
            Adicionar ao {mealLabel}
          </OrangeButton>
        </Modal>
      )}

      {scanOpen && (
        <Modal title="Escanear alimento" onClose={() => setScanOpen(false)}>
          <p className="text-sm text-[#8A8F87]">
            Digite o código de barras da embalagem. Sem câmera por perto? Você também pode buscar pelo nome do produto.
          </p>
          <TextField
            label="Código de barras"
            inputMode="numeric"
            value={scanCodigo}
            onChange={(e) => { setScanCodigo(e.target.value); setScanErro(""); }}
            placeholder="Ex: 7891000100103"
          />
          {scanErro && <p className="text-xs" style={{ color: "#EF4444" }}>{scanErro}</p>}
          <OrangeButton disabled={!scanCodigo.trim()} onClick={buscarPorCodigo}>Buscar</OrangeButton>
        </Modal>
      )}
    </div>
  );
}


function Treino({ profile, day, salvarTreino, removeExercise }) {
  const [categoria, setCategoria] = useState("musculacao");
  const [titulo, setTitulo] = useState("Peito e tríceps");
  const [duracao, setDuracao] = useState(45);
  const [exercicios, setExercicios] = useState([
    { id: 1, nome: "Supino reto com barra", series: 4, reps: 10, carga: 40 },
    { id: 2, nome: "Supino inclinado halteres", series: 3, reps: 12, carga: 14 },
  ]);
  const [outroNome, setOutroNome] = useState(EXERCISE_DB[0].nome);

  const cat = CATEGORIAS_TREINO.find((c) => c.id === categoria);
  const met = categoria === "mais" ? (EXERCISE_DB.find((e) => e.nome === outroNome)?.met || 4) : cat.met;
  const kcalEstimado = Math.round(met * profile.peso * (duracao / 60));

  const addExercicioRow = () => {
    setExercicios([...exercicios, { id: Date.now(), nome: "Novo exercício", series: 3, reps: 10, carga: 0 }]);
  };
  const updateExercicio = (id, campo, valor) => {
    setExercicios(exercicios.map((e) => (e.id === id ? { ...e, [campo]: valor } : e)));
  };
  const removerExercicioRow = (id) => setExercicios(exercicios.filter((e) => e.id !== id));

  const salvar = () => {
    salvarTreino({
      id: Date.now(), nome: titulo || cat.label, categoria, duracaoMin: duracao, kcal: kcalEstimado,
      detalhes: categoria === "musculacao" ? exercicios : [],
    });
  };

  return (
    <div className="pb-24">
      <header className="max-w-2xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between anim-page">
        <div>
          <div className="text-xs tracking-wide text-[#8A8F87]">{formatDataLonga()}</div>
          <h1 className="text-2xl font-bold mt-0.5" style={{ color: DARK }}>Registrar treino</h1>
        </div>
        {categoria === "musculacao" && (
          <button onClick={addExercicioRow} aria-label="Adicionar exercício" className="btn-press w-10 h-10 rounded-full bg-white border flex items-center justify-center" style={{ borderColor: BORDER }}>
            <Plus className="w-[18px] h-[18px]" style={{ color: DARK }} />
          </button>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-6 space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1 anim-card">
          {CATEGORIAS_TREINO.map((c) => (
            <button key={c.id} onClick={() => setCategoria(c.id)}
              className="btn-press shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold"
              style={categoria === c.id ? { background: ORANGE, color: "white" } : { background: "white", color: "#3A423C", border: `1px solid ${BORDER}` }}>
              <c.icon className="w-3.5 h-3.5" /> {c.label}
            </button>
          ))}
        </div>

        <div className="anim-card bg-white rounded-3xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="text-xs tracking-wide text-[#8A8F87] mb-1">SESSÃO DE HOJE</div>
              {categoria === "mais" ? (
                <select value={outroNome} onChange={(e) => setOutroNome(e.target.value)}
                  className="text-lg font-bold bg-transparent focus:outline-none w-full" style={{ color: DARK }}>
                  {EXERCISE_DB.map((e) => <option key={e.nome} value={e.nome}>{e.nome}</option>)}
                </select>
              ) : (
                <input value={titulo} onChange={(e) => setTitulo(e.target.value)}
                  className="text-lg font-bold bg-transparent focus:outline-none w-full" style={{ color: DARK }} />
              )}
              <div className="text-xs text-[#8A8F87] mt-0.5">em andamento</div>
            </div>
            <div className="text-right shrink-0 pl-3">
              <div className="flex items-baseline gap-1 justify-end">
                <input type="number" value={duracao} onChange={(e) => setDuracao(Number(e.target.value))}
                  className="text-2xl font-bold bg-transparent text-right w-14 focus:outline-none" style={{ color: DARK }} />
                <span className="text-sm text-[#8A8F87]">min</span>
              </div>
            </div>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#EFECE4] overflow-hidden mt-4">
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, (duracao / 60) * 100)}%`, background: ORANGE }} />
          </div>
        </div>

        {categoria === "musculacao" && (
          <div className="anim-card">
            <div className="text-xs tracking-wide text-[#8A8F87] font-semibold mb-2 px-1">EXERCÍCIOS · {exercicios.length}</div>
            <div className="space-y-2">
              {exercicios.map((ex) => (
                <div key={ex.id} className="bg-white rounded-2xl border p-4" style={{ borderColor: BORDER }}>
                  <div className="flex items-center justify-between mb-3">
                    <input value={ex.nome} onChange={(e) => updateExercicio(ex.id, "nome", e.target.value)}
                      className="text-sm font-semibold bg-transparent focus:outline-none flex-1" style={{ color: DARK }} />
                    <button onClick={() => removerExercicioRow(ex.id)} aria-label={`Remover ${ex.nome}`} className="btn-press text-[#8A8F87]"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <MiniStepper label="SÉRIES" value={ex.series} onChange={(v) => updateExercicio(ex.id, "series", v)} />
                    <MiniStepper label="REPS" value={ex.reps} onChange={(v) => updateExercicio(ex.id, "reps", v)} />
                    <MiniStepper label="CARGA" value={ex.carga} unidade="kg" onChange={(v) => updateExercicio(ex.id, "carga", v)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="anim-card bg-white rounded-2xl border p-4 flex items-center justify-between" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4" style={{ color: ORANGE }} />
            <span className="text-sm text-[#3A423C]">Gasto estimado</span>
          </div>
          <span className="text-lg font-bold" style={{ color: TEAL }}>{kcalEstimado} kcal</span>
        </div>

        <OrangeButton onClick={salvar}>Salvar treino</OrangeButton>

        {day.exercises.length > 0 && (
          <div className="pt-2">
            <div className="text-xs tracking-wide text-[#8A8F87] font-semibold mb-2 px-1">TREINOS DE HOJE</div>
            <div className="space-y-2">
              {day.exercises.map((ex) => (
                <div key={ex.id} className="bg-white rounded-2xl border p-4 flex items-center justify-between" style={{ borderColor: BORDER }}>
                  <div>
                    <div className="text-sm font-medium" style={{ color: DARK }}>{ex.nome}</div>
                    <div className="text-xs text-[#8A8F87]">{ex.duracaoMin} min</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold" style={{ color: TEAL }}>-{ex.kcal} kcal</span>
                    <button onClick={() => removeExercise(ex.id)} aria-label={`Remover treino ${ex.nome}`} className="btn-press text-[#8A8F87]"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function MiniStepper({ label, value, onChange, unidade }) {
  return (
    <div>
      <div className="text-[9px] tracking-wide text-[#8A8F87] mb-1">{label}</div>
      <div className="flex items-center bg-[#F7F5EF] rounded-lg px-2 py-1.5">
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-transparent text-sm font-bold focus:outline-none" style={{ color: DARK }} />
        {unidade && <span className="text-xs text-[#8A8F87]">{unidade}</span>}
      </div>
    </div>
  );
}

function Perfil({ profile, onEditar, onSalvarPeso, onSair }) {
  const [pesoHoje, setPesoHoje] = useState(profile.peso);
  const { metaDiaria, tmb, get } = useMemo(() => calcularMetas(profile), [profile]);
  const objetivo = OBJETIVOS.find((o) => o.id === profile.objetivo);
  const iniciais = (profile.nome || "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="pb-24">
      <header className="max-w-2xl mx-auto px-6 pt-8 pb-6 anim-page">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold" style={{ background: DARK }}>
            {iniciais}
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: DARK }}>{profile.nome || "Você"}</div>
            <div className="text-sm text-[#8A8F87]">{profile.email || ""}</div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 space-y-4">
        <div className="anim-card grid grid-cols-3 gap-2">
          <MiniCard label="TMB" valor={tmb} />
          <MiniCard label="GET" valor={get} />
          <MiniCard label="META" valor={metaDiaria} />
        </div>

        <div className="anim-card bg-white rounded-2xl border p-5" style={{ borderColor: BORDER }}>
          <div className="text-xs tracking-wide text-[#8A8F87] font-semibold mb-3">SEUS DADOS</div>
          <div className="space-y-2.5 text-sm">
            <RowInfo label="Sexo biológico" valor={profile.sexo === "M" ? "Masculino" : profile.sexo === "Outro" ? "Outro" : "Feminino"} />
            <RowInfo label="Altura" valor={`${profile.altura} cm`} />
            <RowInfo label="Idade" valor={`${profile.idade} anos`} />
            <RowInfo label="Cintura" valor={`${profile.cintura} cm`} />
            <RowInfo label="Atividade" valor={FATORES_ATIVIDADE.find((f) => f.id === profile.atividade)?.label} />
            <RowInfo label="Objetivo" valor={`${objetivo?.label} (${objetivo?.desc})`} />
          </div>
          <button onClick={onEditar} className="btn-press w-full mt-4 rounded-full py-3 text-sm font-semibold border" style={{ borderColor: DARK, color: DARK }}>
            Editar medidas
          </button>
        </div>

        <div className="anim-card bg-white rounded-2xl border p-5" style={{ borderColor: BORDER }}>
          <div className="text-xs tracking-wide text-[#8A8F87] font-semibold mb-3">REGISTRAR PESO DE HOJE</div>
          <div className="flex gap-2">
            <input type="number" step="0.1" value={pesoHoje} onChange={(e) => setPesoHoje(Number(e.target.value))}
              className="flex-1 bg-[#F7F5EF] rounded-xl px-4 py-3 text-[15px] font-bold focus:outline-none" style={{ color: DARK }} />
            <button onClick={() => onSalvarPeso(pesoHoje)} className="btn-press px-5 rounded-xl text-sm font-semibold text-white" style={{ background: TEAL }}>
              Salvar
            </button>
          </div>
        </div>

        <button onClick={onSair} className="btn-press w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-[#8A8F87]">
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </main>
    </div>
  );
}

function MiniCard({ label, valor }) {
  return (
    <div className="bg-white rounded-2xl border p-3 text-center" style={{ borderColor: BORDER }}>
      <div className="text-[9px] tracking-wide text-[#8A8F87]">{label}</div>
      <div className="text-base font-bold" style={{ color: DARK }}>{valor}</div>
    </div>
  );
}

function RowInfo({ label, valor }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#8A8F87]">{label}</span>
      <span className="font-medium" style={{ color: DARK }}>{valor}</span>
    </div>
  );
}

// ================= PREMIUM: motor de propostas =================

// Monta um cardápio do dia distribuindo a meta entre as refeições
const DISTRIBUICAO_REFEICOES = { cafe: 0.25, almoco: 0.35, lanche: 0.10, jantar: 0.30 };

const TEMPLATES_REFEICAO = {
  cafe: [
    ["Ovo mexido", "Pão de forma integral", "Mamão", "Café sem açúcar"],
    ["Aveia em flocos", "Leite desnatado", "Banana", "Pasta de amendoim"],
    ["Tapioca", "Queijo minas frescal", "Suco de laranja natural"],
    ["Iogurte natural desnatado", "Granola", "Morango"],
  ],
  almoco: [
    ["Arroz integral cozido", "Feijão carioca cozido", "Peito de frango grelhado", "Alface", "Tomate"],
    ["Arroz branco cozido", "Lentilha cozida", "Tilápia grelhada", "Brócolis cozido", "Cenoura cozida"],
    ["Batata-doce cozida", "Carne bovina moída (patinho)", "Couve refogada", "Repolho cru"],
    ["Macarrão integral cozido", "Molho de tomate", "Peito de frango grelhado", "Rúcula"],
  ],
  lanche: [
    ["Maçã", "Castanha de caju"],
    ["Iogurte grego", "Mirtilo (blueberry)"],
    ["Banana", "Pasta de amendoim"],
    ["Queijo cottage", "Torrada integral"],
  ],
  jantar: [
    ["Ovo cozido", "Abobrinha refogada", "Batata cozida", "Alface"],
    ["Tilápia grelhada", "Arroz integral cozido", "Vagem cozida"],
    ["Peito de frango grelhado", "Abóbora cozida", "Espinafre cozido"],
    ["Sopa: Lentilha cozida", "Cenoura cozida", "Couve refogada"],
  ],
};

function montarCardapio(metaDiaria, seed = 0) {
  const plano = {};
  Object.entries(DISTRIBUICAO_REFEICOES).forEach(([mealId, fracao]) => {
    const alvo = Math.round(metaDiaria * fracao);
    const opcoes = TEMPLATES_REFEICAO[mealId];
    const nomes = opcoes[(seed + mealId.length) % opcoes.length];
    // Busca os alimentos e escala as porções para chegar perto do alvo
    const itens = nomes
      .map((n) => TACO.find((f) => f.nome === n.replace("Sopa: ", "")))
      .filter(Boolean)
      .map((f) => {
        const base = f.unidade ? f.unidade.gramas : 100;
        return { food: f, gramas: base, kcal: Math.round((f.kcal100g * base) / 100) };
      });
    const somaBase = itens.reduce((s, i) => s + i.kcal, 0) || 1;
    const escala = alvo / somaBase;
    const ajustados = itens.map((i) => {
      const mult = Math.max(0.5, Math.min(3, escala));
      const g = Math.round(i.gramas * mult);
      const f = i.food;
      const qtdUnidade = f.unidade ? Math.max(1, Math.round(g / f.unidade.gramas)) : null;
      const gFinal = qtdUnidade ? qtdUnidade * f.unidade.gramas : g;
      return {
        nome: f.nome,
        grupo: f.grupo,
        gramas: gFinal,
        label: qtdUnidade ? `${qtdUnidade} ${f.unidade.label}${qtdUnidade !== 1 ? "s" : ""}` : `${gFinal} g`,
        kcal: Math.round((f.kcal100g * gFinal) / 100),
      };
    });
    plano[mealId] = { alvo, itens: ajustados, total: ajustados.reduce((s, i) => s + i.kcal, 0) };
  });
  return plano;
}

// Encontra substituições mais leves dentro do mesmo grupo alimentar
function sugerirSubstituicoes(day, limite = 5) {
  const todos = Object.entries(day.meals).flatMap(([mealId, items]) => items.map((i) => ({ ...i, mealId })));
  const ordenados = [...todos].sort((a, b) => b.kcal - a.kcal);
  const sugestoes = [];

  for (const item of ordenados) {
    if (sugestoes.length >= limite) break;
    const original = TACO.find((f) => f.nome === item.nome);
    if (!original) continue;

    // 1) substituição curada, quando existir
    const curada = SUBSTITUICOES[item.nome];
    let alvo = curada ? TACO.find((f) => f.nome === curada.alt) : null;

    // 2) senão, o alimento mais leve do mesmo grupo com ao menos 25% menos kcal
    if (!alvo) {
      const candidatos = TACO
        .filter((f) => f.grupo === original.grupo && f.kcal100g < original.kcal100g * 0.75)
        .sort((a, b) => b.kcal100g - a.kcal100g);
      alvo = candidatos[0];
    }
    if (!alvo) continue;

    const novaKcal = Math.round((alvo.kcal100g * item.gramas) / 100);
    const economia = item.kcal - novaKcal;
    if (economia < 20) continue;

    sugestoes.push({
      mealId: item.mealId,
      de: item.nome,
      para: alvo.nome,
      porcao: item.label,
      kcalDe: item.kcal,
      kcalPara: novaKcal,
      economia,
    });
  }
  return sugestoes;
}

// Propõe treinos para cobrir uma lacuna calórica
function sugerirTreinos(peso, kcalAlvo) {
  if (kcalAlvo <= 0) return [];
  const opcoes = [
    { nome: "Caminhada rápida", met: 4.8 },
    { nome: "Corrida leve (8 km/h)", met: 8.3 },
    { nome: "Bike moderada", met: 6.8 },
    { nome: "Musculação", met: 5.0 },
    { nome: "HIIT", met: 9.5 },
    { nome: "Natação", met: 7.0 },
  ];
  return opcoes.map((o) => {
    const kcalPorMin = (o.met * peso) / 60;
    return { ...o, minutos: Math.ceil(kcalAlvo / kcalPorMin), kcalPorMin: Math.round(kcalPorMin) };
  }).sort((a, b) => a.minutos - b.minutos);
}

function PremiumBadge() {
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md tracking-wide"
      style={{ background: GOLD, color: "#4A3A10" }}>PREMIUM</span>
  );
}

function Propostas({ profile, day, isPremium, onAtivarPremium, aplicarCardapio, aplicarSubstituicao }) {
  const metas = useMemo(() => calcularMetas(profile), [profile]);
  const [seed, setSeed] = useState(0);
  const [aba, setAba] = useState("cardapio");

  const cardapio = useMemo(() => montarCardapio(metas.metaDiaria, seed), [metas.metaDiaria, seed]);
  const substituicoes = useMemo(() => sugerirSubstituicoes(day), [day]);

  const consumido = useMemo(() => Object.values(day.meals).flat().reduce((s, f) => s + f.kcal, 0), [day.meals]);
  const queimado = useMemo(() => day.exercises.reduce((s, e) => s + e.kcal, 0), [day.exercises]);
  const excesso = Math.max(0, (consumido - queimado) - metas.metaDiaria);
  const treinos = useMemo(() => sugerirTreinos(profile.peso, excesso || 250), [profile.peso, excesso]);

  const totalCardapio = useMemo(() => Object.values(cardapio).reduce((s, m) => s + m.total, 0), [cardapio]);
  const economiaTotal = useMemo(() => substituicoes.reduce((s, x) => s + x.economia, 0), [substituicoes]);

  if (!isPremium) {
    return (
      <div className="pb-24">
        <header className="max-w-2xl mx-auto px-6 pt-8 pb-4 anim-page">
          <div className="text-xs tracking-wide text-[#8A8F87]">{formatDataLonga()}</div>
          <h1 className="text-2xl font-bold mt-0.5" style={{ color: DARK }}>Propostas</h1>
        </header>
        <main className="max-w-2xl mx-auto px-6">
          <div className="anim-card rounded-3xl p-6 text-white" style={{ background: DARK }}>
            <div className="flex items-center gap-2 mb-3"><Sparkles className="w-5 h-5" style={{ color: GOLD }} /><PremiumBadge /></div>
            <h2 className="text-xl font-bold leading-tight">Deixe o app montar seu dia</h2>
            <p className="text-sm text-white/60 mt-2 mb-5">
              Cardápio completo dentro da sua meta, trocas inteligentes para cortar calorias sem passar fome
              e treinos calculados para fechar a diferença.
            </p>
            <ul className="space-y-2.5 mb-6">
              {[
                "Cardápio diário nas 4 refeições, ajustado à sua meta",
                "Substituições dentro do mesmo grupo alimentar",
                "Treinos com duração exata para o seu peso",
                "Aplicar qualquer sugestão com um toque",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-white/85">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: GOLD }} /> {t}
                </li>
              ))}
            </ul>
            <button onClick={onAtivarPremium}
              className="btn-press w-full rounded-full py-3.5 text-sm font-bold" style={{ background: GOLD, color: "#3A2C08" }}>
              Ativar Premium
            </button>
            <p className="text-[11px] text-white/40 text-center mt-3">
              Sugestões automáticas não substituem orientação de nutricionista ou educador físico.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <header className="max-w-2xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between anim-page">
        <div>
          <div className="text-xs tracking-wide text-[#8A8F87]">{formatDataLonga()}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-2xl font-bold" style={{ color: DARK }}>Propostas</h1>
            <PremiumBadge />
          </div>
        </div>
        {aba === "cardapio" && (
          <button onClick={() => setSeed(seed + 1)}
            className="btn-press flex items-center gap-1.5 bg-white border rounded-full px-3 py-2 text-xs font-medium"
            style={{ borderColor: BORDER, color: DARK }}>
            <RefreshCw className="w-3.5 h-3.5" /> Trocar
          </button>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-6 space-y-4">
        <div className="bg-[#EFECE4] rounded-full p-1 flex anim-card">
          {[
            { id: "cardapio", label: "Cardápio" },
            { id: "trocas", label: "Trocas" },
            { id: "treino", label: "Treino" },
          ].map((t) => (
            <button key={t.id} onClick={() => setAba(t.id)}
              className="btn-press flex-1 py-2.5 rounded-full text-sm font-semibold"
              style={aba === t.id ? { background: "white", color: DARK, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" } : { color: "#8A8F87" }}>
              {t.label}
            </button>
          ))}
        </div>

        {aba === "cardapio" && (
          <>
            <div className="anim-card bg-white rounded-2xl border p-4 flex justify-between items-center" style={{ borderColor: BORDER }}>
              <div>
                <div className="text-xs text-[#8A8F87]">TOTAL DO CARDÁPIO</div>
                <div className="text-xl font-bold" style={{ color: DARK }}>{totalCardapio} kcal</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#8A8F87]">SUA META</div>
                <div className="text-xl font-bold" style={{ color: TEAL }}>{metas.metaDiaria} kcal</div>
              </div>
            </div>

            {MEAL_TYPES.map((m) => {
              const bloco = cardapio[m.id];
              if (!bloco) return null;
              return (
                <div key={m.id} className="anim-card bg-white rounded-2xl border p-4" style={{ borderColor: BORDER }}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs tracking-wide text-[#8A8F87] font-semibold">{m.label.toUpperCase()}</span>
                    <span className="text-sm font-bold" style={{ color: DARK }}>{bloco.total} kcal</span>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    {bloco.itens.map((i) => (
                      <div key={i.nome} className="flex justify-between text-sm">
                        <span style={{ color: DARK }}>{i.nome}</span>
                        <span className="text-[#8A8F87] text-xs shrink-0 pl-3">{i.label} · {i.kcal} kcal</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => aplicarCardapio(m.id, bloco.itens)}
                    className="btn-press w-full rounded-full py-2.5 text-xs font-semibold border"
                    style={{ borderColor: DARK, color: DARK }}>
                    Adicionar ao {m.label.toLowerCase()}
                  </button>
                </div>
              );
            })}
          </>
        )}

        {aba === "trocas" && (
          <>
            {substituicoes.length === 0 ? (
              <div className="anim-card bg-white rounded-2xl border p-6 text-center" style={{ borderColor: BORDER }}>
                <p className="text-sm text-[#8A8F87]">
                  Registre suas refeições em Comida para ver trocas que cortam calorias sem mudar o volume do prato.
                </p>
              </div>
            ) : (
              <>
                <div className="anim-card rounded-2xl p-4" style={{ background: `${TEAL}12` }}>
                  <div className="text-xs text-[#8A8F87]">ECONOMIA SE APLICAR TODAS</div>
                  <div className="text-2xl font-bold" style={{ color: TEAL }}>-{economiaTotal} kcal</div>
                </div>
                {substituicoes.map((s, idx) => (
                  <div key={idx} className="anim-card bg-white rounded-2xl border p-4" style={{ borderColor: BORDER }}>
                    <div className="text-[10px] tracking-wide text-[#8A8F87] mb-2">
                      {MEAL_TYPES.find((m) => m.id === s.mealId)?.label.toUpperCase()} · {s.porcao}
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1">
                        <div className="text-sm line-through text-[#8A8F87]">{s.de}</div>
                        <div className="text-xs text-[#8A8F87]">{s.kcalDe} kcal</div>
                      </div>
                      <ArrowRight className="w-4 h-4 shrink-0" style={{ color: TEAL }} />
                      <div className="flex-1 text-right">
                        <div className="text-sm font-medium" style={{ color: DARK }}>{s.para}</div>
                        <div className="text-xs" style={{ color: TEAL }}>{s.kcalPara} kcal</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 rounded-lg px-3 py-2 text-xs font-bold" style={{ background: `${TEAL}12`, color: TEAL }}>
                        economiza {s.economia} kcal
                      </div>
                      <button onClick={() => aplicarSubstituicao(s)}
                        className="btn-press rounded-full px-4 py-2 text-xs font-semibold text-white" style={{ background: DARK }}>
                        Aplicar
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {aba === "treino" && (
          <>
            <div className="anim-card rounded-2xl p-4" style={{ background: excesso > 0 ? `${ORANGE}12` : `${TEAL}12` }}>
              <div className="text-xs text-[#8A8F87]">
                {excesso > 0 ? "PARA ZERAR O EXCESSO DE HOJE" : "PARA ACELERAR SEU RESULTADO"}
              </div>
              <div className="text-2xl font-bold" style={{ color: excesso > 0 ? ORANGE : TEAL }}>
                {excesso > 0 ? excesso : 250} kcal
              </div>
            </div>
            {treinos.map((t) => (
              <div key={t.nome} className="anim-card bg-white rounded-2xl border p-4 flex items-center justify-between" style={{ borderColor: BORDER }}>
                <div>
                  <div className="text-sm font-medium" style={{ color: DARK }}>{t.nome}</div>
                  <div className="text-xs text-[#8A8F87]">≈ {t.kcalPorMin} kcal/min no seu peso</div>
                </div>
                <div className="text-right shrink-0 pl-3">
                  <div className="text-lg font-bold" style={{ color: DARK }}>{t.minutos}</div>
                  <div className="text-[10px] text-[#8A8F87]">min</div>
                </div>
              </div>
            ))}
            <p className="text-[11px] text-[#8A8F87] text-center pt-1">
              Estimativas por MET. Ajuste conforme sua condição física e orientação profissional.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
