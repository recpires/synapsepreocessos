import { GlobalRegistrator } from '@happy-dom/global-registrator'

/**
 * DOM para os testes de interface.
 *
 * Carregado com `--import` antes dos testes: o React precisa de `document` no
 * momento em que é importado, e registrar dentro do arquivo de teste já seria
 * tarde.
 */
GlobalRegistrator.register({ url: 'http://localhost:3000' })

// O React 18 avisa sobre `act` se isto não estiver marcado, e o aviso polui a
// saída a ponto de esconder a falha de verdade.
;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true
