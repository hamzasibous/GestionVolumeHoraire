import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface SimulationResult {
  id: number;
  nomScenario: string;
  anneeCible: number;
  nb_filieres_ajoutees: number;
  nb_nouveaux_cours: number;
  nb_profs_ajoutes: number;
  nb_locaux_ajoutes: number;
  strategie_traitement: string;
  croissance_etudiante_pct: number;
  utiliser_donnees_actuelles: boolean;
  utiliser_moyenne_departement: boolean;
  volume_actuel: number;
  volume_total_prevu: number;
  moyenne_charge_actuelle: number;
  moyenne_charge_prevue: number;
  deficit_horaire: number;
  nb_vacataires_estimes: number;
  result_data?: any[];
  progress: number;
  message: string;
  status: string;
}

const ForecastingSimulation: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState('');
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  const [params, setParams] = useState({
    nomScenario: 'Prévision ' + (new Date().getFullYear() + 1),
    anneeCible: new Date().getFullYear() + 1,
    periode: 'autumn',
    nb_filieres_ajoutees: 1,
    nb_nouveaux_cours: 5,
    nb_profs_ajoutes: 2,
    nb_locaux_ajoutes: 1,
    strategie_traitement: 'EQUITE',
    croissance_etudiante_pct: 5.0,
    utiliser_donnees_actuelles: true,
    utiliser_moyenne_departement: false,
  });

  const [result, setResult] = useState<SimulationResult | null>(null);

  // Fetch latest simulation on mount
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/analyse/simulations/');
        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            const latest = data[0];
            if (latest.status === 'RUNNING' || latest.status === 'PENDING') {
              setLoading(true);
              startPolling(latest.id);
            } else {
              setResult(latest);
              // Update params to match the latest simulation
              setParams({
                nomScenario: latest.nomScenario,
                anneeCible: latest.anneeCible,
                periode: latest.periode || 'autumn',
                nb_filieres_ajoutees: latest.nb_filieres_ajoutees,
                nb_nouveaux_cours: latest.nb_nouveaux_cours,
                nb_profs_ajoutes: latest.nb_profs_ajoutes,
                nb_locaux_ajoutes: latest.nb_locaux_ajoutes,
                strategie_traitement: latest.strategie_traitement,
                croissance_etudiante_pct: latest.croissance_etudiante_pct,
                utiliser_donnees_actuelles: latest.utiliser_donnees_actuelles,
                utiliser_moyenne_departement: latest.utiliser_moyenne_departement,
              });
            }
          }
        }
      } catch (error) {
        console.error("Error fetching latest simulation:", error);
      }
    };
    fetchLatest();
  }, []);

  const [currentSimId, setCurrentSimId] = useState<number | null>(null);

  const handleCancel = async () => {
    if (!currentSimId) return;
    
    try {
      const response = await fetch(`http://localhost:8000/api/analyse/simulations/${currentSimId}/cancel/`, {
        method: 'POST',
      });
      if (response.ok) {
        if (pollInterval.current) clearInterval(pollInterval.current);
        setLoading(false);
        setCurrentSimId(null);
      }
    } catch (error) {
      console.error('Error cancelling simulation:', error);
    }
  };

  const startPolling = (simId: number) => {
    setCurrentSimId(simId);
    if (pollInterval.current) clearInterval(pollInterval.current);
    
    pollInterval.current = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/analyse/simulations/${simId}/`);
        if (response.ok) {
          const data = await response.json();
          setGenerationProgress(data.progress);
          setGenerationMessage(data.message);
          
          if (data.status === 'COMPLETED') {
            if (pollInterval.current) clearInterval(pollInterval.current);
            setResult(data);
            setLoading(false);
            setCurrentSimId(null);
          } else if (data.status === 'FAILED') {
            if (pollInterval.current) clearInterval(pollInterval.current);
            alert(`Erreur de simulation: ${data.message}`);
            setLoading(false);
            setCurrentSimId(null);
          } else if (data.status === 'CANCELLED') {
            if (pollInterval.current) clearInterval(pollInterval.current);
            setLoading(false);
            setCurrentSimId(null);
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 1000);
  };

  const handleSimulate = async () => {
    setLoading(true);
    setGenerationProgress(0);
    setGenerationMessage("Initialisation...");
    
    try {
      const response = await fetch('http://localhost:8000/api/analyse/simulations/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await response.json();
      startPolling(data.id);
    } catch (error) {
      console.error('Error starting simulation:', error);
      setLoading(false);
    }
  };

  const handleReset = () => {
    setParams({
      nomScenario: 'Prévision ' + (new Date().getFullYear() + 1),
      anneeCible: new Date().getFullYear() + 1,
      periode: 'autumn',
      nb_filieres_ajoutees: 0,
      nb_nouveaux_cours: 0,
      nb_profs_ajoutes: 0,
      nb_locaux_ajoutes: 0,
      strategie_traitement: 'EQUITE',
      croissance_etudiante_pct: 0,
      utiliser_donnees_actuelles: true,
      utiliser_moyenne_departement: false,
    });
    setResult(null);
  };

  useEffect(() => {
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-lg max-w-[1400px] mx-auto p-4 relative">
      {/* Progress Modal */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-12 border border-slate-200 animate-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="w-16 h-16 rounded-full bg-sky-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-sky-500 text-4xl animate-spin">psychology</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">IA Simulation en cours</h3>
                <p className="text-slate-500 text-sm font-medium">{generationMessage}</p>
              </div>
              
              <div className="w-full space-y-3">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Optimisation Génétique</span>
                  <span>{generationProgress}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div 
                    className="h-full bg-sky-500 transition-all duration-500 ease-out" 
                    style={{ width: `${generationProgress}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 italic">L'algorithme génétique teste des milliers de combinaisons pour valider votre scénario...</p>
              
              <button 
                onClick={handleCancel}
                className="mt-4 px-6 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">close</span>
                Annuler la simulation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-outline-variant pb-md gap-4">
        <div>
          <h2 className="font-h1 text-h1 text-on-background mb-xs tracking-tight">Système de Prévision & Simulation</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Estimer les besoins futurs et simuler la redistribution des charges pour {params.anneeCible}.</p>
        </div>
        <button 
          onClick={handleSimulate}
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-on-primary font-h3 text-sm px-6 py-2.5 rounded shadow-sm transition-all flex items-center gap-2 h-fit active:scale-95 uppercase tracking-wider disabled:opacity-50"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{loading ? 'sync' : 'analytics'}</span>
          {loading ? 'Simulation...' : 'Lancer Simulation'}
        </button>
      </div>

      <div className="grid grid-cols-12 gap-gutter mt-6">
        {/* Scenario Inputs Card */}
        <div className="col-span-12 xl:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-lg p-md shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-outline-variant pb-sm">
            <span className="material-symbols-outlined text-secondary-container">settings_suggest</span>
            <h3 className="font-h3 text-h3 text-on-background tracking-tight">Paramètres du Scénario</h3>
          </div>
          
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded text-primary focus:ring-primary"
                checked={params.utiliser_donnees_actuelles}
                onChange={(e) => setParams({...params, utiliser_donnees_actuelles: e.target.checked})}
              />
              <span className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors">Utiliser les volumes actuels</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded text-primary focus:ring-primary"
                checked={params.utiliser_moyenne_departement}
                onChange={(e) => setParams({...params, utiliser_moyenne_departement: e.target.checked})}
              />
              <span className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors">Baser sur la moyenne de département</span>
            </label>
          </div>

          <div className="flex flex-col gap-4 border-t border-outline-variant pt-4">
            <div className="flex flex-col gap-xs">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Nombre de nouvelles filières</label>
              <input 
                className="w-full bg-surface-bright border border-outline-variant rounded px-3 py-2 outline-none focus:border-primary shadow-inner" 
                type="number" 
                value={params.nb_filieres_ajoutees}
                onChange={(e) => setParams({...params, nb_filieres_ajoutees: parseInt(e.target.value)})}
              />
            </div>
            
            <div className="flex flex-col gap-xs">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Nouveaux cours prévus</label>
              <input 
                className="w-full bg-surface-bright border border-outline-variant rounded px-3 py-2 outline-none focus:border-primary shadow-inner" 
                type="number" 
                value={params.nb_nouveaux_cours}
                onChange={(e) => setParams({...params, nb_nouveaux_cours: parseInt(e.target.value)})}
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Nouveaux professeurs à recruter</label>
              <input 
                className="w-full bg-surface-bright border border-outline-variant rounded px-3 py-2 outline-none focus:border-primary shadow-inner" 
                type="number" 
                value={params.nb_profs_ajoutes}
                onChange={(e) => setParams({...params, nb_profs_ajoutes: parseInt(e.target.value)})}
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Nouveaux locaux acquis</label>
              <input 
                className="w-full bg-surface-bright border border-outline-variant rounded px-3 py-2 outline-none focus:border-primary shadow-inner" 
                type="number" 
                value={params.nb_locaux_ajoutes}
                onChange={(e) => setParams({...params, nb_locaux_ajoutes: parseInt(e.target.value)})}
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Période de Simulation</label>
              <select 
                className="w-full bg-surface-bright border border-outline-variant rounded px-3 py-2 outline-none focus:border-primary shadow-inner cursor-pointer" 
                value={params.periode}
                onChange={(e) => setParams({...params, periode: e.target.value})}
              >
                <option value="autumn">Semestres Impairs (S1, S3, S5, M1, M3)</option>
                <option value="spring">Semestres Pairs (S2, S4, S6, M2, M4)</option>
              </select>
            </div>

            <div className="flex flex-col gap-xs">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Stratégie de redistribution</label>
              <select 
                className="w-full bg-surface-bright border border-outline-variant rounded px-3 py-2 outline-none focus:border-primary shadow-inner cursor-pointer" 
                value={params.strategie_traitement}
                onChange={(e) => setParams({...params, strategie_traitement: e.target.value})}
              >
                <option value="EQUITE">Équité (Charge équilibrée)</option>
                <option value="JUNIOR">Junior (Priorité TD/TP)</option>
                <option value="SENIOR">Senior (Priorité CM)</option>
                <option value="ALLEGEMENT">Allégement (Réduction globale)</option>
              </select>
            </div>
          </div>

          <button 
            onClick={handleReset}
            className="w-full bg-surface-bright text-primary border border-outline-variant hover:bg-surface-container-low font-bold py-2 rounded transition-colors uppercase tracking-widest text-[10px] mt-2"
          >
            Réinitialiser les paramètres
          </button>
        </div>

        <div className="col-span-12 xl:col-span-8 flex flex-col gap-gutter">
          {!result ? (
            <div className="flex-1 bg-surface-container-low border border-dashed border-outline-variant rounded-lg flex flex-col items-center justify-center p-12 text-outline">
              <span className="material-symbols-outlined text-6xl mb-4 opacity-10">monitoring</span>
              <p className="font-h3 text-center">Configurez votre scénario et lancez la simulation pour visualiser l'évolution des charges.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-gutter animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md shadow-sm">
                  <h4 className="text-[10px] font-bold text-outline uppercase tracking-widest">Volume Actuel</h4>
                  <div className="text-2xl font-bold text-on-background mt-1">{result.volume_actuel} <span className="text-sm font-normal">hrs</span></div>
                  <div className="text-[10px] text-outline mt-1 italic">Données de l'année en cours</div>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md shadow-sm">
                  <h4 className="text-[10px] font-bold text-outline uppercase tracking-widest">Volume Futur Prévu</h4>
                  <div className="text-2xl font-bold text-primary mt-1">{result.volume_total_prevu} <span className="text-sm font-normal">hrs</span></div>
                  <div className="text-[10px] text-primary font-medium mt-1">+{result.volume_total_prevu - result.volume_actuel} hrs d'évolution</div>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md shadow-sm">
                  <h4 className="text-[10px] font-bold text-outline uppercase tracking-widest">Capacité Profs/Locaux</h4>
                  <div className="text-2xl font-bold text-secondary mt-1">+{params.nb_profs_ajoutes}P / +{params.nb_locaux_ajoutes}L</div>
                  <div className="text-[10px] text-secondary font-medium mt-1">Nouvelles ressources</div>
                </div>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-md">
                <h3 className="font-h3 text-lg mb-6 border-b border-outline-variant pb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">balance</span>
                  Simulation de la Redistribution des Charges
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="flex flex-col items-center text-center p-6 bg-surface-bright rounded-xl border border-outline-variant/50">
                    <span className="text-[11px] font-black text-outline uppercase tracking-widest mb-4">Charge Moyenne Actuelle</span>
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-outline/10" />
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 * (1 - Math.min(result.moyenne_charge_actuelle / 300, 1))} className="text-outline" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black">{result.moyenne_charge_actuelle}</span>
                        <span className="text-[9px] uppercase font-bold text-outline">hrs / prof</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center text-center p-6 bg-primary/5 rounded-xl border border-primary/20">
                    <span className="text-[11px] font-black text-primary uppercase tracking-widest mb-4">Charge Moyenne Projetée</span>
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-primary/10" />
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 * (1 - Math.min(result.moyenne_charge_prevue / 300, 1))} className="text-primary" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-primary">{result.moyenne_charge_prevue}</span>
                        <span className="text-[9px] uppercase font-bold text-primary">hrs / prof</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 bg-on-surface/5 p-4 rounded-lg flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary">lightbulb</span>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Chaque nouvelle filière ajoute <strong>6 semestres</strong> complets (S1-S6). 
                    Selon votre configuration, cela représente <strong>7 modules par semestre</strong> (5 de 4h et 2 de 2h), soit un impact annuel de <strong>2016 heures</strong> par filière.
                    Avec l'ajout de <strong>{params.nb_profs_ajoutes} nouveaux professeurs</strong> et une stratégie <strong>{params.strategie_traitement}</strong>, 
                    la charge moyenne par enseignant évolue de <strong>{result.moyenne_charge_actuelle}h</strong> à <strong>{result.moyenne_charge_prevue}h</strong>.
                    Un recrutement de <strong>{result.nb_vacataires_estimes} vacataires</strong> est recommandé pour stabiliser le département à la moyenne statutaire de 192h.
                  </p>
                </div>

                <div className="mt-6 flex justify-end">
                  <button 
                    onClick={() => navigate(`/forecasting/timetable/${result.id}`)}
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                  >
                    <span className="material-symbols-outlined">calendar_view_day</span>
                    Voir l'Emploi du Temps Simulé
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForecastingSimulation;
