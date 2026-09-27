// The housing writer's OWN structural refusal, branded. requireUpsertInput in
// server/freehold_db.ts throws it before a byte reaches the database, so it is
// an ANSWER about the document: the same document is refused the same way
// every time. The retry clock (server/freehold_write_retry.ts) quiesces on it
// and on a payload SQLSTATE, and treats every other throw (a dropped
// connection, a timeout, a store bug, a read-back after the statement) as a
// fault a repeat can clear. A TypeError, as every refusal there always was, so
// a caller that tested for one still passes. Its own module so the retry
// clock's pure leaf can test for it without importing the database layer.
export class FreeholdUpsertRefused extends TypeError {
  constructor(message: string) {
    super(message);
    this.name = 'FreeholdUpsertRefused';
  }
}
