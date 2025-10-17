import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, setDoc, deleteDoc, onSnapshot, query, writeBatch, getDocs, Timestamp, where, getDoc, orderBy, limit, updateDoc, deleteField } from 'firebase/firestore';
import { ChevronDown, ChevronRight, Plus, Save, Trash2, X, BookOpen, Calendar as CalendarIcon, Repeat, Home, Play, Pause, RefreshCw, GripVertical, CalendarDays, ChevronsRight, Star, AlertTriangle, RefreshCcw } from 'lucide-react';

// --- Dados Iniciais para Concursos PM/GCM AP (DETALHADO) ---
const initialData = [
    { name: "Língua Portuguesa", topics: [
        "Compreensão e interpretação de textos de gêneros variados", "Tipologia textual (narração, descrição, dissertação)", "Ortografia oficial e Acentuação gráfica", "Emprego das classes de palavras (morfologia)", "Estrutura e formação de palavras", "Sintaxe da oração e do período (termos da oração)", "Período composto por coordenação e subordinação", "Concordância verbal e nominal (regras gerais e casos especiais)", "Regência verbal e nominal (regras gerais e casos especiais)", "Uso do sinal indicativo de crase", "Pontuação e seus sinais", "Significação das palavras (sinônimos, antônimos, homônimos, parônimos)"
    ]},
    { name: "Raciocínio Lógico e Matemático", topics: [
        "Estruturas lógicas: proposições simples e compostas", "Conectivos lógicos (e, ou, não, se... então, se e somente se)", "Construção de Tabelas-verdade", "Tautologia, contradição e contingência", "Lógica de argumentação: validação de argumentos", "Diagramas lógicos (silogismos)", "Operações com conjuntos (união, intersecção, diferença)", "Análise Combinatória: princípio da contagem, arranjo, combinação", "Probabilidade: conceitos básicos e cálculo", "Porcentagem, juros simples e compostos", "Regra de três simples e composta", "Razão e proporção"
    ]},
    { name: "Noções de Informática", topics: [
        "Conceitos de hardware: periféricos e componentes", "Conceitos de software: sistemas operacionais e aplicativos", "Sistema Operacional Windows: arquivos, pastas e configurações", "Editor de texto Microsoft Word: formatação, tabelas, impressão", "Planilha eletrônica Microsoft Excel: fórmulas, funções, gráficos", "Conceitos de Internet e Intranet", "Navegadores web (Google Chrome, Mozilla Firefox)", "Correio eletrônico (e-mail): envio e recebimento", "Segurança da Informação: vírus, malwares, antivírus", "Cópias de segurança (backup)", "Conceitos de redes de computadores"
    ]},
    { name: "Atualidades", topics: [
        "Tópicos relevantes e atuais de diversas áreas (política, economia, sociedade)", "Cenário político e econômico do Brasil", "Desenvolvimento sustentável e meio ambiente no Brasil e na Amazônia", "Relações internacionais e geopolítica", "Acontecimentos de ampla divulgação na mídia (últimos 6 meses)"
    ]},
    { name: "Geografia do Amapá", topics: [
        "Localização, limites e fronteiras do Amapá", "Relevo, clima, vegetação e hidrografia do estado", "Unidades de Conservação e terras indígenas no Amapá", "Divisão política e administrativa: municípios", "Aspectos demográficos: população, migração, urbanização", "Principais atividades econômicas: extrativismo, mineração, agricultura", "Infraestrutura: transportes e energia"
    ]},
    { name: "História do Amapá", topics: [
        "Ocupação pré-colonial e primeiros contatos", "Disputas territoriais: a Questão do Contestado Amapaense (Laudo Suíço)", "A criação do Território Federal do Amapá", "O ciclo do Manganês e a ICOMI", "A transformação do Território em Estado", "Governadores e principais fatos políticos recentes", "Cultura e sociedade amapaense"
    ]},
    { name: "Noções de Direito Constitucional", topics: [
        "Princípios Fundamentais (Art. 1º ao 4º da CF)", "Direitos e Deveres Individuais e Coletivos (Art. 5º da CF)", "Direitos Sociais (Art. 6º ao 11 da CF)", "Da Nacionalidade (Art. 12 e 13 da CF)", "Da Administração Pública: Disposições Gerais e Servidores (Art. 37 ao 41)", "Da Defesa do Estado e das Instituições Democráticas", "Da Segurança Pública (Art. 144 da CF)"
    ]},
    { name: "Noções de Direito Administrativo", topics: [
        "Estado, Governo e Administração Pública: conceitos", "Princípios da Administração Pública (Legalidade, Impessoalidade, Moralidade, etc.)", "Organização Administrativa: administração direta e indireta", "Atos Administrativos: conceito, requisitos, atributos, classificação e extinção", "Poderes Administrativos: vinculado, discricionário, hierárquico, disciplinar e de polícia", "Agentes Públicos: espécies e classificação; direitos e deveres", "Responsabilidade Civil do Estado (Art. 37, § 6º da CF)"
    ]},
    { name: "Noções de Direito Penal", topics: [
        "Princípios básicos do Direito Penal", "Aplicação da lei penal no tempo e no espaço", "Do Crime: fato típico, ilicitude, culpabilidade", "Dolo e Culpa", "Crimes contra a pessoa: homicídio, lesão corporal, crimes contra a honra", "Crimes contra o patrimônio: furto, roubo, extorsão, estelionato", "Crimes contra a Administração Pública praticados por funcionário público", "Crimes contra a Administração Pública praticados por particular"
    ]},
    { name: "Noções de Direitos Humanos", topics: [
        "Teoria geral dos direitos humanos: conceito, terminologia, estrutura", "Afirmação histórica dos direitos humanos", "Características dos direitos humanos", "Declaração Universal dos Direitos Humanos (DUDH)", "Direitos Humanos na Constituição Federal de 1988", "Programa Nacional de Direitos Humanos (PNDH-3)"
    ]}
];


// --- Funções Auxiliares ---
const addDays = (date, days) => { const result = new Date(date); result.setDate(result.getDate() + days); return result; };
const Spinner = () => ( <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-300"></div> );

// --- Configuração do Firebase (A SER PREENCHIDA PELO USUÁRIO) ---
const firebaseConfig = { apiKey: "AIzaSyB9eCE4KTnVzxAFVavTUQux28yv7yVKzT0",
  authDomain: "gordinnn-dfa7e.firebaseapp.com",
  projectId: "gordinnn-dfa7e",
  storageBucket: "gordinnn-dfa7e.firebasestorage.app",
  messagingSenderId: "788602864459",
  appId: "1:788602864459:web:bbf6aff73bdab2459ddece",
  measurementId: "G-YXT1CN71R1" };
const appId = "study-flow"; // Você pode manter este nome

// --- Componente de Confirmação ---
function ConfirmationModal({ isOpen, onClose, onConfirm, title, message }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-md mx-4 border border-slate-700">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="text-yellow-400" size={24} />
                    <h3 className="text-xl font-bold text-slate-100">{title}</h3>
                </div>
                <p className="text-slate-400 mt-4 mb-6">{message}</p>
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold transition-colors">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors">
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}


// --- Componente Principal ---
export default function App() {
    const { auth, db } = useMemo(() => {
        if (!firebaseConfig.apiKey) {
            return { auth: null, db: null };
        }
        try {
            const app = initializeApp(firebaseConfig);
            const auth = getAuth(app);
            const db = getFirestore(app);
            return { auth, db };
        } catch (e) {
            console.error("Erro ao inicializar o Firebase. Verifique sua configuração.", e);
            return { auth: null, db: null };
        }
    }, []);

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                try {
                    await signInAnonymously(auth);
                } catch (error) { console.error("Erro na autenticação anônima:", error); }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [auth]);
    
    if (!auth || !db) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-900 text-white p-8">
                <div className="text-center bg-slate-800 p-8 rounded-lg shadow-2xl">
                    <h1 className="text-2xl font-bold text-red-400 mb-4">Erro de Configuração</h1>
                    <p>As credenciais do Firebase não foram encontradas.</p>
                    <p className="mt-2 text-slate-400">Por favor, siga o **Passo 3** do guia para adicionar sua `firebaseConfig` no arquivo `App.js`.</p>
                </div>
            </div>
        );
    }
    
    if (loading) return <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white"><Spinner /><p className="mt-4">Carregando...</p></div>;
    if (!user) return <div className="flex items-center justify-center h-screen bg-slate-900 text-white">Falha na autenticação. Por favor, verifique suas regras de segurança do Firebase.</div>;

    return <StudyTracker userId={user.uid} db={db} />;
}

// --- Componente do Organizador de Estudos ---
function StudyTracker({ userId, db }) {
    const [subjects, setSubjects] = useState([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState(null);
    const [newSubjectName, setNewSubjectName] = useState("");
    const [progress, setProgress] = useState({});
    const [activeView, setActiveView] = useState('home');
    const [modalState, setModalState] = useState({ isOpen: false, onConfirm: () => {} });

    const subjectsCollectionPath = `artifacts/${appId}/users/${userId}/subjects`;

    const calculateProgress = useCallback(async () => {
        if (!userId || !db) return;
        const subjectsQuery = query(collection(db, subjectsCollectionPath));
        const querySnapshot = await getDocs(subjectsQuery);
        const newProgress = {};
        for (const subjectDoc of querySnapshot.docs) {
            const topicsPath = `${subjectsCollectionPath}/${subjectDoc.id}/topics`;
            const topicsQuery = query(collection(db, topicsPath));
            const topicsSnapshot = await getDocs(topicsQuery);
            const totalTopics = topicsSnapshot.size;
            if (totalTopics === 0) {
                newProgress[subjectDoc.id] = 0;
                continue;
            }
            const completedTopics = topicsSnapshot.docs.filter(doc => doc.data().status === 'Concluído').length;
            newProgress[subjectDoc.id] = Math.round((completedTopics / totalTopics) * 100);
        }
        setProgress(newProgress);
    }, [userId, db, subjectsCollectionPath]);
    
    useEffect(() => {
        if (!userId || !db) return;
        const checkAndPopulateInitialData = async () => {
            const subjectsQuery = query(collection(db, subjectsCollectionPath), limit(1));
            const snapshot = await getDocs(subjectsQuery);

            if (snapshot.empty) {
                const batch = writeBatch(db);
                initialData.forEach(subjectData => {
                    const subjectRef = doc(collection(db, subjectsCollectionPath));
                    batch.set(subjectRef, { 
                        name: subjectData.name, 
                        createdAt: Timestamp.now()
                    });
                    subjectData.topics.forEach(topicName => {
                        const topicRef = doc(collection(db, subjectRef.path, 'topics'));
                        batch.set(topicRef, { name: topicName, status: "Não iniciado", checklist: [], notes: "", createdAt: Timestamp.now(), reviewsActive: true });
                    });
                });
                await batch.commit();
            }
        };
        checkAndPopulateInitialData();

        const subjectsQuery = query(collection(db, subjectsCollectionPath), orderBy("name"));
        const unsubscribe = onSnapshot(subjectsQuery, (querySnapshot) => {
            const subjectsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSubjects(subjectsData);
        }, (error) => console.error("Error fetching subjects:", error));
        
        return () => unsubscribe();
    }, [userId, db, subjectsCollectionPath]);
    
    useEffect(() => { calculateProgress(); }, [subjects, calculateProgress]);

    const handleAddSubject = async (e) => {
        e.preventDefault();
        if (newSubjectName.trim() === "") return;
        await addDoc(collection(db, subjectsCollectionPath), { 
            name: newSubjectName, 
            createdAt: Timestamp.now()
        });
        setNewSubjectName("");
    };

    const confirmDeleteSubject = (subjectId) => {
        setModalState({
            isOpen: true,
            title: "Confirmar Exclusão",
            message: "Tem certeza de que deseja excluir esta matéria? Todos os tópicos, checklists e anotações associados a ela serão perdidos permanentemente.",
            onConfirm: () => {
                handleDeleteSubject(subjectId);
                closeModal();
            }
        });
    };

    const handleDeleteSubject = async (subjectId) => {
        const batch = writeBatch(db);
        const topicsPath = `${subjectsCollectionPath}/${subjectId}/topics`;
        const topicsSnapshot = await getDocs(query(collection(db, topicsPath)));
        const topicIds = topicsSnapshot.docs.map(doc => doc.id);
        
        topicsSnapshot.forEach(topicDoc => batch.delete(topicDoc.ref));
        topicIds.forEach(topicId => {
            const reviewRef = doc(db, `artifacts/${appId}/users/${userId}/reviews`, topicId);
            const metadataRef = doc(db, `artifacts/${appId}/users/${userId}/topicsMetadata`, topicId);
            batch.delete(reviewRef);
            batch.delete(metadataRef);
        });
        
        const subjectDocRef = doc(db, subjectsCollectionPath, subjectId);
        batch.delete(subjectDocRef);
        await batch.commit();
        
        if (selectedSubjectId === subjectId) setSelectedSubjectId(null);
    };

    const closeModal = () => setModalState({ isOpen: false, onConfirm: () => {} });

    const handleSelectLastTopic = useCallback(({subjectId, topicId}) => {
        setSelectedSubjectId(subjectId);
        setActiveView('subjects');
    }, []);

    const selectedSubject = useMemo(() => subjects.find(s => s.id === selectedSubjectId), [subjects, selectedSubjectId]);
    
    return (
        <>
            <ConfirmationModal 
                isOpen={modalState.isOpen}
                onClose={closeModal}
                onConfirm={modalState.onConfirm}
                title={modalState.title}
                message={modalState.message}
            />
            <div className="flex h-screen bg-gradient-to-br from-gray-900 to-slate-800 text-slate-100 font-sans antialiased">
                <aside className="w-1/4 min-w-[320px] bg-black/20 p-6 flex flex-col backdrop-blur-sm border-r border-slate-700/50">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-indigo-500/20 rounded-lg"><BookOpen className="text-indigo-400" size={24}/></div>
                        <h1 className="text-2xl font-bold text-slate-100 tracking-wider">StudyFlow</h1>
                    </div>
                    <form onSubmit={handleAddSubject} className="flex mb-6">
                        <input type="text" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="Nova matéria..." className="flex-grow bg-slate-800/70 text-white rounded-l-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"/>
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-r-md transition-colors"><Plus size={20} /></button>
                    </form>
                    <nav className="flex-grow overflow-y-auto -mr-3 pr-3">
                         <ul className="space-y-2">
                            {subjects.map(subject => (
                                <li key={subject.id}>
                                    <div className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-300 group ${selectedSubjectId === subject.id && activeView === 'subjects' ? 'bg-indigo-500/30 shadow-lg' : 'hover:bg-slate-700/50'}`}>
                                        <div onClick={() => { setSelectedSubjectId(subject.id); setActiveView('subjects'); }} className="flex-grow">
                                            <span className="font-semibold text-slate-200">{subject.name}</span>
                                            <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2"><div className="bg-gradient-to-r from-green-400 to-teal-500 h-1.5 rounded-full" style={{ width: `${progress[subject.id] || 0}%` }}></div></div>
                                        </div>
                                        <button onClick={() => confirmDeleteSubject(subject.id)} className="ml-3 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </aside>
                <main className="flex-1 p-8 overflow-y-auto flex flex-col">
                    <header className="flex border-b border-slate-700/50 mb-8 overflow-x-auto">
                        <NavButton icon={<Home size={18}/>} label="Início" activeView={activeView} viewName="home" onClick={setActiveView} />
                        <NavButton icon={<BookOpen size={18}/>} label="Matérias" activeView={activeView} viewName="subjects" onClick={setActiveView} />
                        <NavButton icon={<CalendarIcon size={18}/>} label="Ciclo" activeView={activeView} viewName="cycle" onClick={setActiveView} />
                        <NavButton icon={<Repeat size={18}/>} label="Revisões" activeView={activeView} viewName="reviews" onClick={setActiveView} />
                        <NavButton icon={<CalendarDays size={18}/>} label="Visão Geral" activeView={activeView} viewName="schedule" onClick={setActiveView} />
                    </header>
                    <div className="flex-grow">
                        {activeView === 'home' && <HomeView userId={userId} appId={appId} setActiveView={setActiveView} db={db} onContinue={handleSelectLastTopic} />}
                        {activeView === 'subjects' && (selectedSubject ? <SubjectView key={selectedSubject.id} subject={selectedSubject} userId={userId} appId={appId} onTopicsUpdate={calculateProgress} db={db} /> : <div className="text-center text-slate-500 mt-20"><h2 className="text-2xl">Selecione uma matéria para começar.</h2><p>Clique em uma matéria na barra lateral.</p></div>)}
                        {activeView === 'cycle' && <StudyCycleView userId={userId} subjects={subjects} db={db} />}
                        {activeView === 'reviews' && <ReviewsView userId={userId} appId={appId} db={db} />}
                        {activeView === 'schedule' && <ScheduleView userId={userId} appId={appId} db={db} />}
                    </div>
                </main>
            </div>
        </>
    );
}

const NavButton = ({ icon, label, activeView, viewName, onClick }) => (
    <button onClick={() => onClick(viewName)} className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${activeView === viewName ? 'text-indigo-400 border-indigo-400' : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-500'}`}>
        {icon} {label}
    </button>
);

function HomeView({ userId, appId, setActiveView, db, onContinue }) {
    const [cycleItems, setCycleItems] = useState([]);
    const [cycleState, setCycleState] = useState({ currentPosition: 0 });
    const [reviewsTodayCount, setReviewsTodayCount] = useState(0);

    useEffect(() => {
        const cycleItemsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/studyCycleItems`);
        const q = query(cycleItemsCollectionRef, orderBy('order'));
        const unsubCycleItems = onSnapshot(q, (snapshot) => setCycleItems(snapshot.docs.map(d => d.data())));

        const cycleStateDocRef = doc(db, `artifacts/${appId}/users/${userId}/studyCycleState`, 'main');
        const unsubCycleState = onSnapshot(cycleStateDocRef, (docSnap) => { if (docSnap.exists()) setCycleState(docSnap.data()); });

        const reviewsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/reviews`);
        const qReviews = query(reviewsCollectionRef, where('nextReviewDate', '<=', Timestamp.now()));
        const unsubReviews = onSnapshot(qReviews, (snapshot) => setReviewsTodayCount(snapshot.size));

        return () => { unsubCycleItems(); unsubCycleState(); unsubReviews(); };
    }, [userId, appId, db]);

    const currentStudyItem = cycleItems.length > 0 ? cycleItems[cycleState.currentPosition % cycleItems.length] : null;
    const getGreeting = () => { const hour = new Date().getHours(); if (hour < 12) return "Bom dia"; if (hour < 18) return "Boa tarde"; return "Boa noite"; };

    return (
        <div className="flex flex-col gap-8 animate-fade-in">
            <h2 className="text-4xl font-bold text-slate-100">{getGreeting()}!</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ContinueStudying userId={userId} appId={appId} onSelectTopic={onContinue} db={db} />
                <div className="bg-slate-800/50 p-6 rounded-2xl flex flex-col border border-slate-700/50">
                    <h3 className="text-xl font-bold text-slate-200 mb-4">Sua Missão de Hoje</h3>
                    <div className="bg-slate-900/70 p-6 rounded-lg text-center flex-grow flex flex-col justify-center">
                        {currentStudyItem ? (
                            <>
                                <p className="text-slate-400 text-sm">Matéria do ciclo:</p>
                                <p className="text-3xl font-bold text-indigo-400 my-2">{currentStudyItem.subjectName}</p>
                            </>
                        ) : <p className="text-slate-400">Configure seu ciclo de estudos!</p>}
                    </div>
                    <button onClick={() => setActiveView('cycle')} className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">Ir para o Ciclo</button>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-2xl flex flex-col border border-slate-700/50">
                    <h3 className="text-xl font-bold text-slate-200 mb-4">Revisões Pendentes</h3>
                    <div className="bg-slate-900/70 p-6 rounded-lg text-center flex-grow flex flex-col justify-center">
                         <p className="text-6xl font-bold text-green-400">{reviewsTodayCount}</p>
                         <p className="text-slate-400 text-sm mt-1">revisões para hoje</p>
                    </div>
                    <button onClick={() => setActiveView('reviews')} className="mt-4 w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">Ver Revisões</button>
                </div>
                <PomodoroTimer />
            </div>
        </div>
    );
}

function ContinueStudying({ userId, appId, onSelectTopic, db }) {
    const [lastTopic, setLastTopic] = useState(null);
    useEffect(() => {
        const q = query(collection(db, `artifacts/${appId}/users/${userId}/topicsMetadata`), orderBy("lastStudied", "desc"), limit(1));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) { setLastTopic({id: snapshot.docs[0].id, ...snapshot.docs[0].data()}); } 
            else { setLastTopic(null); }
        });
        return unsubscribe;
    }, [userId, appId, db]);

    if (!lastTopic) return null;

    return (
        <div className="bg-gradient-to-tr from-yellow-500/20 to-orange-500/20 p-6 rounded-2xl flex flex-col border border-yellow-500/50 col-span-1 md:col-span-2 lg:col-span-3">
            <div className="flex items-center gap-4">
                <Star className="text-yellow-400" size={24} />
                <div className="flex-grow">
                    <h3 className="text-xl font-bold text-slate-200">Continue Seus Estudos</h3>
                    <p className="text-slate-400">Você parou em: <span className="font-semibold text-slate-300">{lastTopic.topicName}</span> de <span className="font-semibold text-slate-300">{lastTopic.subjectName}</span></p>
                </div>
                <button onClick={() => onSelectTopic(lastTopic)} className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
                    Continuar de Onde Parou <ChevronsRight size={18} />
                </button>
            </div>
        </div>
    );
}

function PomodoroTimer() {
    const [mode, setMode] = useState('pomodoro');
    const [time, setTime] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const audioRef = useRef(null);
    const timeSettings = { pomodoro: 25 * 60, short: 5 * 60, long: 15 * 60 };

    useEffect(() => {
        let interval = null;
        if (isActive && time > 0) {
            interval = setInterval(() => setTime(t => t - 1), 1000);
        } else if (time === 0) {
            if(audioRef.current) audioRef.current.play();
            setIsActive(false);
        }
        return () => clearInterval(interval);
    }, [isActive, time]);
    
    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => { setIsActive(false); setTime(timeSettings[mode]); };
    const changeMode = (newMode) => { setMode(newMode); setIsActive(false); setTime(timeSettings[newMode]); }
    const formatTime = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

    return (
        <div className="bg-slate-800/50 p-6 rounded-2xl flex flex-col border border-slate-700/50">
            <h3 className="text-xl font-bold text-slate-200 mb-4">Foco Total</h3>
            <div className="flex justify-center gap-2 mb-4">
                 <button onClick={() => changeMode('pomodoro')} className={`px-3 py-1 text-sm rounded-full transition-colors ${mode==='pomodoro' ? 'bg-red-500' : 'bg-slate-700/50 hover:bg-slate-600/50'}`}>Pomodoro</button>
                 <button onClick={() => changeMode('short')} className={`px-3 py-1 text-sm rounded-full transition-colors ${mode==='short' ? 'bg-blue-500' : 'bg-slate-700/50 hover:bg-slate-600/50'}`}>Pausa Curta</button>
                 <button onClick={() => changeMode('long')} className={`px-3 py-1 text-sm rounded-full transition-colors ${mode==='long' ? 'bg-cyan-500' : 'bg-slate-700/50 hover:bg-slate-600/50'}`}>Pausa Longa</button>
            </div>
            <div className="bg-slate-900/70 p-6 rounded-lg text-center flex-grow flex flex-col justify-center">
                 <p className="text-6xl font-mono font-bold text-slate-100">{formatTime(time)}</p>
            </div>
            <div className="mt-4 flex justify-center gap-4">
                 <button onClick={toggleTimer} className="bg-slate-600/80 hover:bg-slate-500/80 p-3 rounded-full transition-colors">{isActive ? <Pause/> : <Play />}</button>
                 <button onClick={resetTimer} className="bg-slate-600/80 hover:bg-slate-500/80 p-3 rounded-full transition-colors"><RefreshCw /></button>
            </div>
            <audio ref={audioRef} src="https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg" preload="auto" />
        </div>
    );
}

function SubjectView({ subject, userId, appId, onTopicsUpdate, db }) {
    const [topics, setTopics] = useState([]);
    const [newTopicName, setNewTopicName] = useState("");
    const [lastStudiedTopicId, setLastStudiedTopicId] = useState(null);
    const [modalState, setModalState] = useState({ isOpen: false, onConfirm: () => {} });

    const subjectPath = `artifacts/${appId}/users/${userId}/subjects/${subject.id}`;
    const topicsCollectionPath = `${subjectPath}/topics`;

    useEffect(() => {
        const unsubscribe = onSnapshot(query(collection(db, topicsCollectionPath)), (snap) => setTopics(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        const qMeta = query(collection(db, `artifacts/${appId}/users/${userId}/topicsMetadata`), orderBy("lastStudied", "desc"), limit(1));
        const unsubMeta = onSnapshot(qMeta, (snapshot) => {
            if (!snapshot.empty) setLastStudiedTopicId(snapshot.docs[0].id);
        });
        return () => { unsubscribe(); unsubMeta(); };
    }, [db, topicsCollectionPath, userId, appId]);

    const handleResetProgress = async () => {
        const batch = writeBatch(db);
        const topicsSnapshot = await getDocs(query(collection(db, topicsCollectionPath)));

        topicsSnapshot.forEach(topicDoc => {
            batch.update(topicDoc.ref, {
                status: "Não iniciado",
                nextReviewDate: deleteField(),
                reviewLevel: deleteField(),
                lastReviewDate: deleteField(),
                performance: deleteField(),
                reviewsActive: true
            });
            const reviewRef = doc(db, `artifacts/${appId}/users/${userId}/reviews`, topicDoc.id);
            batch.delete(reviewRef);
        });

        await batch.commit();
        onTopicsUpdate();
        closeModal();
    };

    const confirmResetProgress = () => {
        setModalState({
            isOpen: true,
            title: "Zerar Progresso da Matéria",
            message: `Tem certeza que deseja zerar o progresso de "${subject.name}"? Todos os tópicos voltarão para "Não iniciado" e o agendamento de revisões será removido.`,
            onConfirm: handleResetProgress
        });
    };

    const closeModal = () => setModalState({ isOpen: false, onConfirm: () => {} });
    
    const handleAddTopic = async (e) => { e.preventDefault(); if (newTopicName.trim() === "") return; await addDoc(collection(db, topicsCollectionPath), { name: newTopicName, status: "Não iniciado", checklist: [], notes: "", createdAt: Timestamp.now(), reviewsActive: true }); setNewTopicName(""); onTopicsUpdate(); };
    const handleDeleteTopic = async (topicId) => { await deleteDoc(doc(db, topicsCollectionPath, topicId)); await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/reviews`, topicId)); onTopicsUpdate(); };
    
    const handleTopicUpdate = async (topicId, currentTopic, updatedData) => {
        const topicRef = doc(db, topicsCollectionPath, topicId);
        const reviewRef = doc(db, `artifacts/${appId}/users/${userId}/reviews`, topicId);
        const metadataRef = doc(db, `artifacts/${appId}/users/${userId}/topicsMetadata`, topicId);
    
        if (updatedData.hasOwnProperty('reviewsActive')) {
            if (updatedData.reviewsActive === false) {
                await updateDoc(topicRef, {
                    reviewsActive: false,
                    nextReviewDate: deleteField(),
                    reviewLevel: deleteField(),
                    lastReviewDate: deleteField()
                });
                await deleteDoc(reviewRef);
            } else {
                const nextReviewDate = Timestamp.fromDate(addDays(new Date(), 1));
                await updateDoc(topicRef, { 
                    reviewsActive: true,
                    nextReviewDate: nextReviewDate,
                    reviewLevel: 1,
                    lastReviewDate: Timestamp.now()
                });
                await setDoc(reviewRef, { topicName: currentTopic.name, subjectName: subject.name, subjectId: subject.id, topicPath: topicRef.path, nextReviewDate: nextReviewDate }, { merge: true });
            }
            return; 
        }
    
        if (updatedData.status === 'Em progresso' || updatedData.notes || updatedData.checklist || updatedData.performance) {
            await setDoc(metadataRef, { topicName: currentTopic.name, subjectName: subject.name, subjectId: subject.id, lastStudied: Timestamp.now() }, { merge: true });
        }
    
        if (updatedData.status === 'Concluído' && currentTopic.status !== 'Concluído') {
            await deleteDoc(metadataRef);
            
            const shouldScheduleForTopic = currentTopic.reviewsActive ?? true;
    
            if (shouldScheduleForTopic) {
                const now = new Date();
                updatedData.lastReviewDate = Timestamp.fromDate(now);
                updatedData.nextReviewDate = Timestamp.fromDate(addDays(now, 1));
                updatedData.reviewLevel = 1;
            }
        }
    
        await updateDoc(topicRef, updatedData);
        
        if (updatedData.nextReviewDate) {
            await setDoc(reviewRef, { topicName: currentTopic.name, subjectName: subject.name, subjectId: subject.id, topicPath: topicRef.path, nextReviewDate: updatedData.nextReviewDate }, { merge: true });
        }
    
        if (updatedData.status !== undefined) onTopicsUpdate();
    };
    
    const sortedTopics = useMemo(() => {
        return [...topics].sort((a, b) => {
            const statusOrder = { "Em progresso": 1, "Não iniciado": 2, "Concluído": 3 };
            return (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4) || a.createdAt.toMillis() - b.createdAt.toMillis();
        });
    }, [topics]);

    return (
        <>
        <ConfirmationModal 
            isOpen={modalState.isOpen}
            onClose={closeModal}
            onConfirm={modalState.onConfirm}
            title={modalState.title}
            message={modalState.message}
        />
        <div className="animate-fade-in">
            <div className="flex justify-between items-start mb-8">
                <h2 className="text-4xl font-bold text-slate-100">{subject.name}</h2>
                <button onClick={confirmResetProgress} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-slate-700/80 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">
                    <RefreshCcw size={16} />
                    Zerar Progresso
                </button>
            </div>
            <form onSubmit={handleAddTopic} className="flex mb-8">
                <input type="text" value={newTopicName} onChange={(e) => setNewTopicName(e.target.value)} placeholder="Adicionar novo tópico..." className="flex-grow bg-slate-800 text-white rounded-l-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-r-md transition-colors">Adicionar</button>
            </form>
            <div className="space-y-4">
                {sortedTopics.map(topic => <TopicItem key={topic.id} topic={topic} isLastStudied={topic.id === lastStudiedTopicId} onDelete={() => handleDeleteTopic(topic.id)} onUpdate={(data) => handleTopicUpdate(topic.id, topic, data)} />)}
            </div>
        </div>
        </>
    );
}

function TopicItem({ topic, isLastStudied, onDelete, onUpdate }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [newChecklistItem, setNewChecklistItem] = useState("");
    const [notes, setNotes] = useState(topic.notes || "");
    const [acertos, setAcertos] = useState(topic.performance?.acertos ?? '');
    const [total, setTotal] = useState(topic.performance?.total ?? '');
    const statusColors = { "Não iniciado": "bg-slate-500", "Em progresso": "bg-yellow-500", "Concluído": "bg-green-500" };

    useEffect(() => {
        setAcertos(topic.performance?.acertos ?? '');
        setTotal(topic.performance?.total ?? '');
    }, [topic.performance]);

    const handleAddChecklistItem = (e) => { e.preventDefault(); if (newChecklistItem.trim() === "") return; onUpdate({ checklist: [...(topic.checklist || []), { text: newChecklistItem, completed: false }] }); setNewChecklistItem(""); };
    const checklistProgress = useMemo(() => { if (!topic.checklist || topic.checklist.length === 0) return 0; const completed = topic.checklist.filter(item => item.completed).length; return Math.round((completed / topic.checklist.length) * 100); }, [topic.checklist]);
    
    const handleSavePerformance = () => {
        const numAcertos = parseInt(acertos, 10);
        const numTotal = parseInt(total, 10);

        if (!isNaN(numAcertos) && !isNaN(numTotal) && numTotal > 0 && numAcertos <= numTotal) {
            onUpdate({
                performance: {
                    acertos: numAcertos,
                    total: numTotal
                }
            });
        }
    };
    
    const performancePercent = useMemo(() => {
        if (topic.performance && topic.performance.total > 0) {
            return Math.round((topic.performance.acertos / topic.performance.total) * 100);
        }
        return null;
    }, [topic.performance]);

    return (
        <div className={`bg-slate-800/70 rounded-lg shadow-md border transition-all ${isLastStudied ? 'border-yellow-500/80' : 'border-transparent'}`}>
            <div className="flex items-center p-4">
                <button onClick={() => setIsExpanded(!isExpanded)} className="mr-4 text-slate-400">{isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}</button>
                <div className="flex-grow">
                   <div className="flex items-center gap-3">
                       <span className="font-semibold text-lg text-slate-200">{topic.name}</span>
                       {isLastStudied && <span className="text-xs font-bold text-yellow-500 bg-yellow-500/20 px-2 py-0.5 rounded-full">Onde você parou</span>}
                   </div>
                   {topic.nextReviewDate && <p className="text-xs text-indigo-400">Próxima revisão: {topic.nextReviewDate.toDate().toLocaleDateString()}</p>}
                </div>
                <select value={topic.status} onChange={(e) => onUpdate({ status: e.target.value })} className={`text-white rounded-md px-3 py-1 text-sm font-semibold focus:outline-none transition-colors ${statusColors[topic.status]}`}>
                    <option value="Não iniciado" className="bg-slate-700">Não iniciado</option>
                    <option value="Em progresso" className="bg-slate-700">Em progresso</option>
                    <option value="Concluído" className="bg-slate-700">Concluído</option>
                </select>
                <button onClick={onDelete} className="ml-4 text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
            </div>
            {isExpanded && (
                <div className="border-t border-slate-700/50 p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold mb-2">Checklist ({checklistProgress}%)</h4>
                        <div className="w-full bg-slate-600 rounded-full h-1.5 mb-3"><div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${checklistProgress}%` }}></div></div>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                           {(topic.checklist || []).map((item, index) => (
                                <div key={index} className="flex items-center group">
                                    <input type="checkbox" checked={item.completed} onChange={() => { const nc = [...topic.checklist]; nc[index].completed = !nc[index].completed; onUpdate({ checklist: nc }); }} className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-600"/>
                                    <label className={`ml-2 text-sm ${item.completed ? 'line-through text-slate-500' : ''}`}>{item.text}</label>
                                    <button onClick={() => onUpdate({ checklist: topic.checklist.filter((_, i) => i !== index)})} className="ml-auto text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100"><X size={14}/></button>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleAddChecklistItem} className="flex mt-3">
                            <input type="text" value={newChecklistItem} onChange={(e) => setNewChecklistItem(e.target.value)} placeholder="Novo item..." className="flex-grow bg-slate-700 text-sm text-white rounded-l-md p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"/>
                            <button type="submit" className="bg-slate-600 hover:bg-slate-500 text-white p-1.5 rounded-r-md"><Plus size={16} /></button>
                        </form>

                        <h4 className="font-semibold mt-6 mb-2">Questões</h4>
                        <div className="bg-slate-900/50 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                                <input type="number" placeholder="Acertos" value={acertos} onChange={e => setAcertos(e.target.value)} onBlur={handleSavePerformance} className="w-full bg-slate-700 text-sm p-1.5 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                                <span className="text-slate-400">/</span>
                                <input type="number" placeholder="Total" value={total} onChange={e => setTotal(e.target.value)} onBlur={handleSavePerformance} className="w-full bg-slate-700 text-sm p-1.5 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            {performancePercent !== null && (
                                <p className="text-sm text-center mt-2 font-semibold text-slate-300">
                                    Aproveitamento: <span className={performancePercent >= 75 ? 'text-green-400' : 'text-yellow-400'}>{performancePercent}%</span>
                                </p>
                            )}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Anotações</h4>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Suas anotações..." className="w-full h-40 bg-slate-700 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"></textarea>
                        <button onClick={() => onUpdate({ notes })} className="mt-2 w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-md text-sm"><Save size={16} className="mr-2"/> Salvar Anotações</button>
                        {(topic.status === 'Concluído' || topic.nextReviewDate) && (
                            <button 
                                onClick={() => onUpdate({ reviewsActive: !(topic.reviewsActive ?? true) })}
                                className={`mt-2 w-full text-sm font-semibold py-2 px-4 rounded-md transition-colors ${
                                    (topic.reviewsActive ?? true)
                                    ? 'bg-red-900/50 hover:bg-red-800/50 text-red-300'
                                    : 'bg-green-900/50 hover:bg-green-800/50 text-green-300'
                                }`}
                            >
                                {(topic.reviewsActive ?? true) ? 'Encerrar Revisões para este Tópico' : 'Reativar Revisões para este Tópico'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function StudyCycleView({ userId, subjects, db }) {
    const [cycleItems, setCycleItems] = useState([]);
    const [cycleState, setCycleState] = useState({ currentPosition: 0 });
    const [subjectToAdd, setSubjectToAdd] = useState('');
    const draggedItem = useRef(null);
    const dragOverItem = useRef(null);
    const cycleItemsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/studyCycleItems`);
    const cycleStateDocRef = doc(db, `artifacts/${appId}/users/${userId}/studyCycleState`, 'main');
    useEffect(() => {
        const q = query(cycleItemsCollectionRef, orderBy('order'));
        const unsubItems = onSnapshot(q, (snapshot) => setCycleItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubState = onSnapshot(cycleStateDocRef, (docSnap) => { if (docSnap.exists()) { setCycleState(docSnap.data()); } else { setDoc(cycleStateDocRef, { currentPosition: 0 }); } });
        return () => { unsubItems(); unsubState(); };
    }, [cycleItemsCollectionRef, cycleStateDocRef]);

    const handleAddSubject = async () => { if (!subjectToAdd || cycleItems.some(item => item.subjectId === subjectToAdd)) return; const subject = subjects.find(s => s.id === subjectToAdd); if (!subject) return; const newOrder = cycleItems.length > 0 ? Math.max(...cycleItems.map(item => item.order)) + 1 : 0; await addDoc(cycleItemsCollectionRef, { subjectId: subject.id, subjectName: subject.name, order: newOrder }); setSubjectToAdd(''); };
    const handleRemoveSubject = async (itemId) => { await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/studyCycleItems`, itemId)); if (cycleState.currentPosition >= cycleItems.length - 1) { await setDoc(cycleStateDocRef, { currentPosition: 0 }); } };
    const handleAdvanceCycle = async () => { if (cycleItems.length === 0) return; const newPosition = (cycleState.currentPosition + 1) % cycleItems.length; await setDoc(cycleStateDocRef, { currentPosition: newPosition }); };
    const handleDragStart = (e, position) => { draggedItem.current = position; }; const handleDragEnter = (e, position) => { dragOverItem.current = position; };
    const handleDragEnd = async () => {
        if (draggedItem.current === null || dragOverItem.current === null || draggedItem.current === dragOverItem.current) return;
        const itemsCopy = [...sortedCycleItems]; const dragged = itemsCopy[draggedItem.current]; itemsCopy.splice(draggedItem.current, 1); itemsCopy.splice(dragOverItem.current, 0, dragged);
        const batch = writeBatch(db); itemsCopy.forEach((item, index) => { const docRef = doc(cycleItemsCollectionRef, item.id); batch.update(docRef, { order: index }); });
        const currentItemId = currentStudyItem?.id; const newPositionOfCurrent = itemsCopy.findIndex(item => item.id === currentItemId);
        if (newPositionOfCurrent !== -1 && newPositionOfCurrent !== cycleState.currentPosition) { await updateDoc(cycleStateDocRef, { currentPosition: newPositionOfCurrent }); }
        await batch.commit(); draggedItem.current = null; dragOverItem.current = null;
    };
    const sortedCycleItems = useMemo(() => [...cycleItems].sort((a, b) => a.order - b.order), [cycleItems]);
    const currentStudyItem = sortedCycleItems.length > 0 ? sortedCycleItems[cycleState.currentPosition % sortedCycleItems.length] : null;
    const availableSubjects = useMemo(() => { const cycleSubjectIds = new Set(cycleItems.map(item => item.subjectId)); return subjects.filter(s => !cycleSubjectIds.has(s.id)); }, [subjects, cycleItems]);
    return (
         <div className="flex flex-col md:flex-row gap-8 animate-fade-in">
            <div className="w-full md:w-1/3 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                <h3 className="text-xl font-bold text-slate-200 mb-4">Matéria do Ciclo</h3>
                <div className="bg-slate-900/70 p-8 rounded-lg text-center">
                    {currentStudyItem ? (<><p className="text-slate-400 text-sm">Próximo a estudar:</p><p className="text-3xl font-bold text-indigo-400 my-2">{currentStudyItem.subjectName}</p></>) : ( <p className="text-slate-400">Adicione matérias ao seu ciclo.</p> )}
                </div>
                <button onClick={handleAdvanceCycle} disabled={cycleItems.length === 0} className="mt-6 w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg transition-colors">Avançar para Próxima</button>
            </div>
            <div className="w-full md:w-2/3 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                <h3 className="text-xl font-bold text-slate-200 mb-4">Configurar Ciclo</h3>
                 <div className="flex gap-2 mb-6">
                    <select value={subjectToAdd} onChange={(e) => setSubjectToAdd(e.target.value)} className="flex-grow bg-slate-700 text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">Selecione para adicionar...</option>
                        {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <button onClick={handleAddSubject} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg">Adicionar</button>
                </div>
                <h4 className="font-semibold text-slate-300 mb-2">Ordem do Ciclo (arraste para reordenar):</h4>
                <div className="space-y-2">
                    {sortedCycleItems.length > 0 ? ( sortedCycleItems.map((item, index) => (
                        <div key={item.id} draggable onDragStart={(e) => handleDragStart(e, index)} onDragEnter={(e) => handleDragEnter(e, index)} onDragEnd={handleDragEnd} onDragOver={(e) => e.preventDefault()}
                             className={`flex items-center p-3 rounded-lg transition-colors cursor-grab active:cursor-grabbing ${index === (cycleState.currentPosition % sortedCycleItems.length) ? 'bg-indigo-900/50' : 'bg-slate-700/80'}`}>
                            <GripVertical className="text-slate-500 mr-2 cursor-grab" size={20}/>
                            <span className="text-indigo-400 font-bold mr-4">{index + 1}.</span>
                            <span className="flex-grow text-slate-100">{item.subjectName}</span>
                            <button onClick={() => handleRemoveSubject(item.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={18}/></button>
                        </div>
                    ))) : ( <p className="text-slate-500 text-center py-4">Seu ciclo está vazio.</p> )}
                </div>
            </div>
        </div>
    );
}

function ScheduleView({ userId, appId, db }) {
    const [allReviews, setAllReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const reviewsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/reviews`);
        const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
        const q = query(reviewsCollectionRef, where('nextReviewDate', '>=', Timestamp.fromDate(startOfToday)), orderBy('nextReviewDate'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => { setAllReviews(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); }, (error) => { console.error("Error fetching schedule:", error); setLoading(false); });
        return unsubscribe;
    }, [userId, appId, db]);
    const groupedReviews = useMemo(() => {
        const groups = {}; allReviews.forEach(review => { const reviewDate = review.nextReviewDate.toDate(); const dateKey = reviewDate.toISOString().split('T')[0]; if (!groups[dateKey]) { groups[dateKey] = { date: reviewDate, reviews: [] }; } groups[dateKey].reviews.push(review); }); return Object.values(groups);
    }, [allReviews]);

    if (loading) return <div className="text-center"><Spinner /> Carregando visão geral...</div>;

    return (
        <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-slate-100 mb-6">Próximas Revisões</h2>
            {allReviews.length === 0 ? ( <p className="text-slate-400">Nenhuma revisão futura agendada.</p> ) : (
                <div className="space-y-6">
                    {groupedReviews.map(({ date, reviews }) => {
                        const dateString = date.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                        const isToday = new Date().toISOString().split('T')[0] === date.toISOString().split('T')[0];
                        return (
                            <div key={date.toISOString()}>
                                <h3 className={`text-xl font-semibold mb-2 p-2 rounded-lg ${isToday ? 'bg-indigo-600/50' : 'bg-slate-800/50'}`}>{dateString} {isToday && '(Hoje)'}</h3>
                                <div className="space-y-2 ml-4 border-l-2 border-slate-700 pl-4">
                                    {reviews.map(review => (<div key={review.id} className="bg-slate-800/50 p-3 rounded-md"><p className="font-semibold text-slate-200">{review.topicName}</p><p className="text-sm text-slate-400">{review.subjectName}</p></div>))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

const reviewIntervals = [1, 7, 15, 30, 60];
function ReviewsView({ userId, appId, db }) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [justReviewed, setJustReviewed] = useState({});

    useEffect(() => {
        const reviewsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/reviews`);
        const q = query(reviewsCollectionRef, where('nextReviewDate', '<=', Timestamp.now()));
        const unsubscribe = onSnapshot(q, (querySnapshot) => { 
            setReviews(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }))); 
            setLoading(false); 
        });
        return unsubscribe;
    }, [userId, appId, db]);
    
    const handleMarkAsReviewed = async (review) => {
        const topicDocRef = doc(db, review.topicPath); 
        const reviewDocRef = doc(db, `artifacts/${appId}/users/${userId}/reviews`, review.id); 
        const topicSnap = await getDoc(topicDocRef);
        
        if (!topicSnap.exists()) { 
            await deleteDoc(reviewDocRef); 
            return; 
        }
        
        const topicData = topicSnap.data();
        const isTopicReviewActive = topicData.reviewsActive ?? true;

        if (isTopicReviewActive) {
            const currentLevel = topicData.reviewLevel || 0; 
            const nextInterval = reviewIntervals[Math.min(currentLevel, reviewIntervals.length - 1)]; 
            const nextReviewDate = addDays(new Date(), nextInterval);
            
            setJustReviewed(prev => ({...prev, [review.id]: nextReviewDate.toLocaleDateString()}));

            const nextReviewTimestamp = Timestamp.fromDate(nextReviewDate);
            const batch = writeBatch(db); 
            batch.update(topicDocRef, { 
                lastReviewDate: Timestamp.now(), 
                nextReviewDate: nextReviewTimestamp, 
                reviewLevel: currentLevel + 1 
            });
            batch.update(reviewDocRef, { nextReviewDate: nextReviewTimestamp }); 
            await batch.commit();
        } else {
            // Se as revisões do tópico não estão ativas, simplesmente remove da lista
            await deleteDoc(reviewDocRef);
        }
    };

    if (loading) return <div className="text-center"><Spinner /> Carregando revisões...</div>;

    return (
        <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-slate-100 mb-6">Revisões Pendentes</h2>
            {reviews.length === 0 ? ( <p className="text-slate-400">Você não tem nenhuma revisão para hoje. Ótimo trabalho!</p> ) : (
                <div className="space-y-3">
                    {reviews.sort((a, b) => a.nextReviewDate.toMillis() - b.nextReviewDate.toMillis()).map(review => (
                        <div key={review.id} className="bg-slate-800/70 p-4 rounded-lg flex items-center justify-between">
                            <div>
                                <p className="font-bold text-lg text-slate-200">{review.topicName}</p>
                                <p className="text-sm text-slate-400">{review.subjectName}</p>
                            </div>
                            {justReviewed[review.id] ? (
                                <span className="text-sm font-semibold text-green-400">Próxima em: {justReviewed[review.id]}</span>
                            ) : (
                                <button onClick={() => handleMarkAsReviewed(review)} className="bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors">Marcar como Revisado</button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

