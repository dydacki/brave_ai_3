export function normalizePolishChars(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0142]/g, 'l') // ł -> l
    .replace(/[\u0141]/g, 'L') // Ł -> L
    .replace(/[\u00F3]/g, 'o') // ó -> o
    .replace(/[\u00D3]/g, 'O') // Ó -> O
    .replace(/[\u0105]/g, 'a') // ą -> a
    .replace(/[\u0104]/g, 'A') // Ą -> A
    .replace(/[\u0119]/g, 'e') // ę -> e
    .replace(/[\u0118]/g, 'E') // Ę -> E
    .replace(/[\u015B]/g, 's') // ś -> s
    .replace(/[\u015A]/g, 'S') // Ś -> S
    .replace(/[\u017C\u017A]/g, 'z') // ż/ź -> z
    .replace(/[\u017B\u0179]/g, 'Z') // Ż/Ź -> Z
    .replace(/[\u0107]/g, 'c') // ć -> c
    .replace(/[\u0106]/g, 'C') // Ć -> C
    .replace(/[\u0144]/g, 'n') // ń -> n
    .replace(/[\u0143]/g, 'N'); // Ń -> N
}
