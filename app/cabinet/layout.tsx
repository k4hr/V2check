import React from 'react';
import LegalFooter from '@/components/LegalFooter';

export const metadata = {
  title: 'Личный кабинет — LiveManager',
};

export default function CabinetLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <LegalFooter />
    </>
  );
}
