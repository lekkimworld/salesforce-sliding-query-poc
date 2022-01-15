


```
openssl req -newkey rsa:2048 -nodes -keyout private_key.pem -x509 -days 365 -out certificate.pem
openssl x509 -outform der -in certificate.pem -out public_key.der
openssl x509 -in certificate.pem -pubkey > public_key.pem
```
