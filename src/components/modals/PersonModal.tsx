import React, { useState, useEffect } from 'react';
import { Camera, User, Phone, Mail, FileText, X } from 'lucide-react';
import { db } from '../../db/db';
import { useAppStore } from '../../store/useAppStore';
import { BottomSheet } from '../ui/BottomSheet';
import { Person } from '../../types';
import { haptics } from '../../utils/haptics';

const COLOR_TAGS = [
  '#007AFF', // Blue
  '#34C759', // Green
  '#FF9500', // Orange
  '#FF3B30', // Red
  '#AF52DE', // Purple
  '#5856D6', // Indigo
  '#5AC8FA', // Teal
  '#FF2D55', // Pink
];

export const PersonModal: React.FC = () => {
  const { isPersonModalOpen, editingPerson, closePersonModal } = useAppStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [colorTag, setColorTag] = useState(COLOR_TAGS[0]);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingPerson) {
      setName(editingPerson.name || '');
      setPhone(editingPerson.phone || '');
      setEmail(editingPerson.email || '');
      setNotes(editingPerson.notes || '');
      setColorTag(editingPerson.colorTag || COLOR_TAGS[0]);
      setAvatarUrl(editingPerson.avatarUrl);
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setNotes('');
      setColorTag(COLOR_TAGS[Math.floor(Math.random() * COLOR_TAGS.length)]);
      setAvatarUrl(undefined);
    }
    setErrorMsg('');
  }, [editingPerson, isPersonModalOpen]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarUrl(event.target!.result as string);
        haptics.impactLight();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Contact name is required.');
      haptics.notificationError();
      return;
    }

    const isEdit = Boolean(editingPerson && editingPerson.id);
    const personId = isEdit ? editingPerson!.id : `person_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const personData: Person = {
      id: personId,
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
      colorTag,
      avatarUrl,
      createdAt: isEdit ? editingPerson!.createdAt : new Date().toISOString(),
    };

    await db.people.put(personData);
    haptics.notificationSuccess();
    closePersonModal();
  };

  return (
    <BottomSheet
      isOpen={isPersonModalOpen}
      onClose={closePersonModal}
      title={editingPerson?.id ? 'Edit Contact' : 'New Contact'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Avatar & Color Picker */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="relative">
            {avatarUrl ? (
              <div className="relative w-20 h-20 rounded-full overflow-hidden shadow-md border-2 border-ios-blue">
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setAvatarUrl(undefined)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/70 text-white rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label
                style={{ backgroundColor: colorTag }}
                className="w-20 h-20 rounded-full flex flex-col items-center justify-center text-white cursor-pointer shadow-md active:scale-95 transition-all"
              >
                <Camera className="w-6 h-6 mb-0.5" />
                <span className="text-[9px] font-semibold">Add Photo</span>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            )}
          </div>

          {/* Color tag palette */}
          <div className="flex items-center gap-2 mt-3">
            {COLOR_TAGS.map((col) => (
              <button
                key={col}
                type="button"
                style={{ backgroundColor: col }}
                onClick={() => {
                  haptics.impactLight();
                  setColorTag(col);
                }}
                className={`w-6 h-6 rounded-full transition-transform ${
                  colorTag === col ? 'scale-125 ring-2 ring-offset-2 ring-ios-blue' : 'opacity-80'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-ios-text-secondaryLight dark:text-ios-text-secondaryDark mb-1.5">
            NAME *
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark text-ios-text-light dark:text-ios-text-dark rounded-xl pl-9 pr-3.5 py-3 text-sm font-semibold border border-black/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-ios-blue"
            />
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ios-text-secondaryLight" />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-semibold text-ios-text-secondaryLight dark:text-ios-text-secondaryDark mb-1.5">
            PHONE NUMBER (OPTIONAL)
          </label>
          <div className="relative">
            <input
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark text-ios-text-light dark:text-ios-text-dark rounded-xl pl-9 pr-3.5 py-3 text-sm border border-black/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-ios-blue"
            />
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ios-text-secondaryLight" />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-ios-text-secondaryLight dark:text-ios-text-secondaryDark mb-1.5">
            EMAIL ADDRESS (OPTIONAL)
          </label>
          <div className="relative">
            <input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark text-ios-text-light dark:text-ios-text-dark rounded-xl pl-9 pr-3.5 py-3 text-sm border border-black/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-ios-blue"
            />
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ios-text-secondaryLight" />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-ios-text-secondaryLight dark:text-ios-text-secondaryDark mb-1.5">
            MEMO / RELATIONSHIP
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Co-worker, gym buddy, family member"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-ios-secondaryCard-light dark:bg-ios-secondaryCard-dark text-ios-text-light dark:text-ios-text-dark rounded-xl p-3 text-sm border border-black/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-ios-blue"
          />
        </div>

        {errorMsg && <p className="text-xs font-medium text-ios-red">{errorMsg}</p>}

        <button
          type="submit"
          className="w-full bg-ios-blue text-white rounded-2xl py-3.5 font-bold text-base shadow-ios-glow-blue active:scale-[0.98] transition-all"
        >
          {editingPerson?.id ? 'Save Contact' : 'Create Contact'}
        </button>
      </form>
    </BottomSheet>
  );
};
