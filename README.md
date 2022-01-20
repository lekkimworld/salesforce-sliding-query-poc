# salesforce-sliding-query-poc #
PoC for running long running query processes against Salesforce. The code consists of two processes a reader (`src/reader.ts`) and a writer (`src/writer.ts`). The reader process will make subsequent queries to Salesforce using the Bulk API and append a start and end date/time to limit the "query window". Read records are written to a Redis list using `RPUSH`. The writer process will `BLPOP` from the query and simply write the messages to the console. You may have multiple writer processes running.

One could use a "real" message queue like RabbitMQ instead of Redis.

The code use the JWT OAuth flow to convert a JWT to an `access_token` for API access. To use do as follows:
1. Create a private/public key pair using `openssl` (see below)
2. Create a Connected App in Salesforce
3. Check "Use Digital Signatues" and upload the `certificate.pem` file
4. Add the "openid", "api" and "offline_access" scopes
5. Pre-approve the application using a permission set or profile

Most settings are read in `src/constants.ts` where to corresponding environment variables may be seen as well.

## OpenSSL commands to generate key pair ##
```
openssl req -newkey rsa:2048 -nodes -keyout private_key.pem -x509 -days 365 -out certificate.pem
openssl x509 -outform der -in certificate.pem -out public_key.der
openssl x509 -in certificate.pem -pubkey > public_key.pem
```
