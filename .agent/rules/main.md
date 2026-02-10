# Master Directive: Gatekeeper Protocol

## Update Protocol (MANDATORY)

- **Match Existing Patterns**: Ensure any new code matches existing project conventions.
- **Run Verification**: After any code modification, you **MUST** run `./verify-changes.sh`.
- **Self-Correction**: If verification fails:
    1. Analyze the output.
    2. Self-correct the code.
    3. Re-run `./verify-changes.sh`.
    4. Repeat until it passes.
- **No Permission Needed**: Do not ask for permission to fix errors found during this verification; simply fix them and report 'Protocol Followed'.
- **Verification First**: Do not commit or mark a task as done until `./verify-changes.sh` passes.
