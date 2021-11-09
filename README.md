# Forta Agent: AAVE Exchange Rates

## Description

This agent detects changes in exchange rates for given pare of tokens.

Environment variables (.env) are used to set up the agent. the following settings can be applied:
- Tokens pair
- alerts thresholds that drive the severity of the finding
- alert for exchange going down or/and up
- MainNet address 

## Supported Chains

- Ethereum

## Alerts

- FORTA-AAVE_EXR_DOWN
  - Fired when exchange rate goes down 
  - Severity: 
    - "info": first thresholds is reached
    - "medium": 2nd thresholds is reached
    - "high": 3rd thresholds is reached
    - "critical": 4th thresholds is reached
  - Type is always set to "info"
  - Meta Data:
    - 'diff': exchange rate difference
    - 'token1',
    - 'token2',
    - 'currentExRate',
    - 'previousExRate',

- FORTA-AAVE_EXR_UP
  - Fired when exchange rate goes up
  - Severity:
    - "info": first thresholds is reached
    - "medium": 2nd thresholds is reached
    - "high": 3rd thresholds is reached
    - "critical": 4th thresholds is reached
  - Type is always set to "info"
  - Meta Data:
    - 'diff': exchange rate difference
    - 'token1',
    - 'token2',
    - 'currentExRate',
    - 'previousExRate',

## Test Data

The agent behaviour can be verified with the following transactions:

TDB
