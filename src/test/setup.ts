import { cleanup, configure } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

// The full bestiary catalog test loads several megabytes of data, so allow
// integration queries a little more time on slower CI machines.
configure({ asyncUtilTimeout: 5000 });

afterEach(() => {
  cleanup();
  localStorage.clear();
});
