export interface OpenFinanceAvailability {
  configured: boolean;
  message: string;
}

// A real provider must be configured through a backend before any bank data
// can be loaded. The mobile app must never hold an aggregator client secret.
export function getOpenFinanceAvailability(): OpenFinanceAvailability {
  return {
    configured: false,
    message: 'Open Finance ainda não está configurado. A conexão ficará disponível quando um provedor real e seu backend estiverem prontos.',
  };
}
