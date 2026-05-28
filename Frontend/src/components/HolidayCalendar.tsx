import React, { useState, useEffect } from 'react';

interface Vacation {
  id: string;
  titre: string;
  startDate: string;
  endDate: string;
  is_global: boolean;
}

interface HolidayCalendarProps {
  onDateSelect: (date: string) => void;
  onClose: () => void;
  selectedDate?: string;
  allowHolidayClick?: boolean;
}

const HolidayCalendar: React.FC<HolidayCalendarProps> = ({ onDateSelect, onClose, selectedDate, allowHolidayClick = false }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [vacations, setVacations] = useState<Vacation[]>([]);

  useEffect(() => {
    fetch('http://localhost:8000/api/core/vacations/')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setVacations(data.map((v: any) => ({
            id: v.id.toString(),
            titre: v.titre || v.type_conge,
            startDate: v.date_debut,
            endDate: v.date_fin,
            is_global: v.is_global,
          })));
        }
      })
      .catch(err => console.error('Error fetching vacations:', err));
  }, []);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const isHoliday = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return vacations.find(v => dateStr >= v.startDate && dateStr <= v.endDate);
  };

  const renderHeader = () => {
    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    return (
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant bg-surface-bright">
        <h4 className="font-bold text-primary uppercase tracking-widest text-xs">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h4>
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            className="p-1 hover:bg-surface-container rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <button 
            type="button"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            className="p-1 hover:bg-surface-container rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    // Weekday headers
    const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const headers = weekDays.map(d => (
      <div key={d} className="text-center text-[10px] font-bold text-outline uppercase py-2">{d}</div>
    ));

    // Empty cells for padding
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    // Actual days
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i);
      const holiday = isHoliday(date);
      const isSelected = selectedDate === date.toISOString().split('T')[0];
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <button
          key={i}
          type="button"
          disabled={!allowHolidayClick && !!holiday}
          onClick={() => onDateSelect(date.toISOString().split('T')[0])}
          className={`h-10 relative flex flex-col items-center justify-center rounded-lg transition-all text-xs
            ${holiday ? 'bg-error-container/20 text-error' : 'hover:bg-primary/10 text-on-surface'}
            ${!allowHolidayClick && !!holiday ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
            ${isSelected ? 'bg-primary !text-on-primary shadow-md scale-110 z-10' : ''}
            ${isToday && !isSelected ? 'border-2 border-primary-container' : ''}
          `}
          title={holiday ? `Jour férié: ${holiday.titre}` : ''}
        >
          <span className="font-bold">{i}</span>
          {holiday && (
            <div className="absolute bottom-1 w-1 h-1 bg-error rounded-full"></div>
          )}
        </button>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-1 p-3">
        {headers}
        {days}
      </div>
    );
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-lg overflow-hidden animate-in zoom-in duration-200">
      {renderHeader()}
      {renderDays()}
      <div className="px-4 py-2 bg-surface-container-low border-t border-outline-variant flex justify-between items-center">
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-error rounded-full"></div>
            <span className="text-[9px] uppercase font-bold text-outline">Jour Férié / Vacances</span>
         </div>
         <button type="button" onClick={onClose} className="text-[9px] uppercase font-bold text-primary hover:underline">Fermer</button>
      </div>
    </div>
  );
};

export default HolidayCalendar;
