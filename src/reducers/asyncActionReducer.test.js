import { setIn, updateIn } from '@hon2a/icepick-fp'

import { defineAsyncType } from '../core'
import {
  asyncActionFlagReducer,
  asyncActionReducer,
  asyncActionStatusReducer,
  splitAsyncActionReducer
} from './asyncActionReducer'
import { testReducerSequence } from '../test/testReducerSequence'

const TYPE = 'SYNC_TYPE'
const ASYNC_TYPE = defineAsyncType('ASYNC_TYPE')
const { PENDING, SUCCESS, FAILURE } = ASYNC_TYPE
const error = 'test error'

describe('asyncActionFlagReducer', () => {
  const reducer = asyncActionFlagReducer(ASYNC_TYPE)

  it('turns on when the action starts', () => {
    expect(reducer(false, { type: PENDING })).toBe(true)
  })

  it('turns off when the action ends', () => {
    expect(reducer(true, { type: SUCCESS })).toBe(false)
    expect(reducer(true, { type: FAILURE })).toBe(false)
  })
})

describe('asyncActionStatusReducer', () => {
  const reducer = asyncActionStatusReducer(ASYNC_TYPE)

  it('inits correctly', () => {
    expect(reducer(undefined, { type: TYPE })).toEqual({
      isPending: false,
      error: undefined
    })
  })

  it('starts progress but keeps old error on action start', () => {
    expect(reducer({ isPending: false, error }, { type: PENDING })).toEqual({ isPending: true, error })
  })

  it('cleans up on action success', () => {
    expect(reducer({ isPending: true, error }, { type: SUCCESS })).toEqual({
      isPending: false,
      error: undefined
    })
  })

  it('updates error on action failure', () => {
    const newError = 'new error'
    expect(reducer({ isPending: true, error }, { type: FAILURE, payload: newError })).toEqual({
      isPending: false,
      error: newError
    })
  })
})

describe('asyncActionReducer', () => {
  const reducer = asyncActionReducer(ASYNC_TYPE, (state, { payload }) => `${state}+${payload.data}`)
  const result = 'previous data'

  it('inits correctly', () => {
    expect(reducer(undefined, { type: TYPE })).toEqual({
      result: undefined,
      isPending: false,
      error: undefined
    })
  })

  it('starts progress but keeps old error on action start', () => {
    expect(reducer({ result, isPending: false, error }, { type: PENDING })).toEqual({
      result,
      isPending: true,
      error
    })
  })

  it('cleans up on action success', () => {
    expect(reducer({ result, isPending: true, error }, { type: SUCCESS, payload: { data: 'new data' } })).toEqual({
      result: `${result}+new data`,
      isPending: false,
      error: undefined
    })
  })

  it('updates error on action failure', () => {
    const newError = 'new error'
    expect(reducer({ result, isPending: true, error }, { type: FAILURE, payload: newError })).toEqual({
      result,
      isPending: false,
      error: newError
    })
  })
})

describe('splitAsyncActionReducer', () => {
  const reducer = splitAsyncActionReducer(ASYNC_TYPE, ({ meta: { path } }) => path)
  const action = (type, path, payload) => ({ type, payload, meta: { path } })
  const result = 'previous data'
  const error = 'test error'

  it('inits correctly', () => {
    expect(reducer(undefined, { type: TYPE })).toEqual({})
  })

  it('stores async action state separately for each path', () => {
    const step = testReducerSequence(reducer, {
      first: { result: 'old result', isPending: false, error: undefined }
    })
    step(action(PENDING, 'first'), setIn('first.isPending', true))
    step(action(PENDING, 'maybe.second'), setIn('maybe.second.isPending', true))
    step(action(FAILURE, 'maybe.second', error), updateIn('maybe.second', sub => ({ ...sub, isPending: false, error })))
    step(action(TYPE, 'ignored'), s => s)
    step(action(SUCCESS, 'first', result), updateIn('first', sub => ({ ...sub, isPending: false, result })))
  })
})
