"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, Lock, CreditCard, CheckCircle2, QrCode } from "lucide-react";

export default function CheckoutPage() {
    const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");

    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-8 font-sans text-gray-900 selection:bg-green-100 selection:text-green-900">
            <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden grid md:grid-cols-2">

                {/* LEFT COLUMN: PRODUCT SUMMARY */}
                <div className="bg-gray-100 p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                    <div className="space-y-6 relative z-10">
                        <div className="w-full aspect-[3/4] bg-black rounded-xl shadow-lg flex items-center justify-center relative overflow-hidden group">
                            {/* Mockup Placeholder */}
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black"></div>
                            <div className="text-center p-6">
                                <div className="text-4xl mb-2">📄</div>
                                <h3 className="text-white font-bold text-xl tracking-wider">DOSSIÊ PRIME AI</h3>
                                <p className="text-gray-400 text-sm">Análise Biométrica Completa</p>
                            </div>
                            {/* Shine Effect */}
                            <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent transform skew-x-12 group-hover:animate-shine transition-all duration-1000" />
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Dossiê Prime AI</h2>
                            <p className="text-gray-500 text-sm mt-1">Relatório detalhado de simetria e plano de correção.</p>
                        </div>

                        <div className="flex items-baseline gap-2">
                            <span className="text-sm text-gray-400 line-through">R$ 97,00</span>
                            <span className="text-3xl font-black text-green-600">R$ 19,90</span>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                <span>Acesso Imediato via E-mail</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <ShieldCheck className="w-5 h-5 text-green-500" />
                                <span>Garantia de 7 Dias</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <Lock className="w-5 h-5 text-green-500" />
                                <span>Pagamento 100% Seguro</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-xs text-center text-gray-400">
                        <p>Produto Digital • Entrega Automática</p>
                    </div>
                </div>

                {/* RIGHT COLUMN: CHECKOUT FORM */}
                <div className="p-8 md:p-12 bg-white flex flex-col justify-center">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Finalizar Compra</h1>
                        <p className="text-gray-500 text-sm">Preencha seus dados para receber o dossiê.</p>
                    </div>

                    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                                <input
                                    type="text"
                                    id="name"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all bg-gray-50"
                                    placeholder="Seu nome aqui"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-mail (para envio do PDF)</label>
                                <input
                                    type="email"
                                    id="email"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all bg-gray-50"
                                    placeholder="seu@email.com"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-1">CPF (para Nota Fiscal)</label>
                                <input
                                    type="text"
                                    id="cpf"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all bg-gray-50"
                                    placeholder="000.000.000-00"
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">Forma de Pagamento</label>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <button
                                    type="button"
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${paymentMethod === 'pix' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                                    onClick={() => setPaymentMethod('pix')}
                                >
                                    <QrCode className="w-6 h-6 mb-2" />
                                    <span className="font-bold text-sm">PIX</span>
                                    <span className="text-[10px] text-green-600 font-bold mt-1">APROVAÇÃO IMEDIATA</span>
                                </button>

                                <button
                                    type="button"
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${paymentMethod === 'card' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                                    onClick={() => setPaymentMethod('card')}
                                >
                                    <CreditCard className="w-6 h-6 mb-2" />
                                    <span className="font-bold text-sm">Cartão</span>
                                </button>
                            </div>

                            <Button
                                size="lg"
                                className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 hover:shadow-green-300 transition-all transform hover:-translate-y-1"
                            >
                                PAGAR R$ 19,90 E RECEBER ANÁLISE
                            </Button>

                            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
                                <Lock className="w-3 h-3" />
                                <span>Ambiente Criptografado e Seguro</span>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
