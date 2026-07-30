import { HistoryRepository } from '../src/infrastructure/repositories/HistoryRepository.js';

export function getHistory() {
    return HistoryRepository.getHistory();
}

export function saveCalculation(entry) {
    return HistoryRepository.saveCalculation(entry);
}

export function clearHistory() {
    return HistoryRepository.clearHistory();
}