import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, UserPlus, Phone, ChevronRight, X } from 'lucide-react';
import { db } from '../db/db';
import { useAppStore } from '../store/useAppStore';
import { TopNavBar } from '../components/layout/TopNavBar';
import { Avatar } from '../components/ui/Avatar';
import { formatCurrency } from '../utils/formatters';
import { haptics } from '../utils/haptics';

export const PeopleView: React.FC = () => {
  const { isPrivacyMode, openAddPerson, openPersonDetail } = useAppStore();

  const [search, setSearch] = useState('');
  const people = useLiveQuery(() => db.people.toArray()) || [];
  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.get('app_settings'));

  const currency = settings?.defaultCurrency || 'USD';

  // Calculate net balance for each person
  const peopleWithBalances = people.map((person) => {
    const personTxs = transactions.filter((t) => t.personId === person.id && t.status !== 'PAID');
    const lent = personTxs
      .filter((t) => t.type === 'LENT')
      .reduce((sum, t) => sum + t.remainingAmount, 0);
    const borrowed = personTxs
      .filter((t) => t.type === 'BORROWED')
      .reduce((sum, t) => sum + t.remainingAmount, 0);

    const net = lent - borrowed; // >0: owes you, <0: you owe
    const activeCount = personTxs.length;

    return {
      ...person,
      lent,
      borrowed,
      net,
      activeCount,
    };
  });

  const filteredPeople = peopleWithBalances.filter((p) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.phone && p.phone.toLowerCase().includes(q)) ||
      (p.notes && p.notes.toLowerCase().includes(q))
    );
  });

  // Sort by highest balance impact first
  filteredPeople.sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

  return (
    <div className="min-h-screen pb-tab-safe">
      <TopNavBar
        title="Contacts"
        subtitle={`${people.length} people tracked`}
        showAdd={true}
        onAddClick={() => openAddPerson()}
      />

      <main className="px-5 py-3 space-y-3.5">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark text-ios-text-light dark:text-ios-text-dark rounded-2xl pl-9 pr-8 py-2.5 text-xs font-medium border border-black/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-ios-blue"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ios-text-secondaryLight" />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ios-text-secondaryLight"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Contact List */}
        {filteredPeople.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <p className="text-xs text-ios-text-secondaryLight">No contacts found.</p>
            <button
              type="button"
              onClick={() => openAddPerson()}
              className="px-4 py-2 rounded-xl bg-ios-blue text-white text-xs font-bold shadow-sm"
            >
              Add First Contact
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPeople.map((person) => (
              <div
                key={person.id}
                onClick={() => {
                  haptics.impactLight();
                  openPersonDetail(person.id);
                }}
                className="p-4 bg-ios-card-light dark:bg-ios-card-dark rounded-2xl border border-black/5 dark:border-white/5 shadow-ios-card flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    name={person.name}
                    avatarUrl={person.avatarUrl}
                    colorTag={person.colorTag}
                    size="md"
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-ios-text-light dark:text-ios-text-dark truncate">
                      {person.name}
                    </h4>
                    <p className="text-xs text-ios-text-secondaryLight dark:text-ios-text-secondaryDark truncate mt-0.5">
                      {person.activeCount > 0
                        ? `${person.activeCount} active loan${person.activeCount > 1 ? 's' : ''}`
                        : 'No active debts'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p
                      className={`text-sm font-black ${
                        person.net > 0
                          ? 'text-ios-blue'
                          : person.net < 0
                          ? 'text-ios-orange'
                          : 'text-ios-text-secondaryLight'
                      } ${isPrivacyMode ? 'blur-sm' : ''}`}
                    >
                      {person.net === 0
                        ? 'Settled'
                        : formatCurrency(Math.abs(person.net), currency, isPrivacyMode)}
                    </p>
                    <p className="text-[10px] text-ios-text-secondaryLight font-medium">
                      {person.net > 0
                        ? 'Owes you'
                        : person.net < 0
                        ? 'You owe'
                        : 'Balanced'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ios-text-secondaryLight" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
