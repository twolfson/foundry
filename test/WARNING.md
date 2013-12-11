**NEVER EVER RUN FOUNDRY VIA .exec**

**WE CANNOT STOP .exec CALLS FROM OCCURRING IN ANOTHER PROCESS**

**We have placed a safe-guard inside of `utils/child-process` (automatically picked up by `mocha --recursive`) for this**

**HOWEVER, TO BE SUPER-SAFE, TESTS MUST BE RUN WITHIN `Vagrant` or `Travis CI`!!**
