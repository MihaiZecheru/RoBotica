export default function GetStartingGreeting(language: string): string {
  switch (language) {
    case 'Romanian':
      return 'Bună! Ce faci?';
    case 'Spanish':
      return 'Hola! ¿Cómo estás?';
    case 'French':
      return 'Salut! Comment ça va?';
    case 'German':
      return 'Hallo! Wie geht es dir?';
    case 'Italian':
      return 'Ciao! Come stai?';
    case 'Portuguese':
      return 'Olá! Como você está?';
    default:
      throw new Error('Invalid language');
  }
}