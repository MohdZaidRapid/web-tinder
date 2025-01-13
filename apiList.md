# DevTinder APIs

authRouter
- POST auth/signup
- POST auth/login
- POST auth/logout
- 
profileRouter
- GET /profile
- PATCH /profile/edit
- PATCH /profile/password

connectionRequestRouter
- POST /request/send/:status/:userId
- - POST/request/review/:status/:requestId
<!-- - POST /request/send/ignored/:userId -->
- POST/request/review/accepted/:requestId
- POST /request/review/rejected/:requestId


- GET /user/connections
- GET user/requests/
- GET user/feed - Gets you the profiles of other users on platform 

Status: ignored, interested, accepted, rejected

