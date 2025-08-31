import crypto from 'crypto';

export function verifyInitData(initData: string) {
  if (!initData) throw new Error('No initData provided');

  // простая проверка, нужно вставить токен
  return { id: 1, first_name: 'Test', last_name: 'User', photo_url: 'https://placekitten.com/100/100' };
}
