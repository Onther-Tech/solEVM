# CP challenge for Tokamak

## Implementation Status

- [x]  컨트랙트에서 storage 필드를 해쉬하기 위한 함수 구현
- [x]  컨트랙트에서 storage 지원
- [x]  검증시 입력값을 solEVM이 실행할 수 있도록 타입 변환
- [x]  검증시 결과값을 해쉬할 수 있도록 타입 변환
- [x]  local VM에 storage 필드 생성
- [x]  local VM에 SSTORE, SLOAD 구현
- [x]  storage 필드 반영하여 검증 머클트리 생성
- [x]  오프체인에서 SSTORE set, reset에 따른 검증 입력값(proof, execution state) 생성
- [x]  external call(verification of a contract code in offchain) 구현
- [ ]  ERC-20 컨트랙트 검증 (balanceOf, transfer)
- [ ]  storage에 대한 머클트리 구현( 검증 이전의 stroage 값이 있을 때 검증관련)
- [ ]  오프체인에서 storage 머클루트 및 머클 proof 입력값 생성
- [ ]  컨트랙트에서 storage 머클루트 및 머클 proof 반영
- [ ]  opcode CALL 구현
- [ ]  opcode DELEGATECALL 구현
- [ ]  compact storage 구현
- [ ]  compact return data 구현
- [ ]  execution state에 LOG 필드 추가
- [ ]  compact log 구현
- [ ]  기타 미구현 OPCODE 구현(BALANCE, LOG, GASLIMIT, EXTCODESIZE, EXTCODECOPY, EXTCODEHASH, RETURNDATASIZE, ...)
- [ ]  Plasma EVM 클라이언트와 오프체인연산모델 integration(GO porting)
