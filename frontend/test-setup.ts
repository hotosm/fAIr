import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

if (!globalThis.URL.createObjectURL) {
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-blob');
}