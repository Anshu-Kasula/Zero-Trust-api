# Secure Access Control Framework for Cloud APIs (Zero Trust)


This project is a Secure Access Control Framework built using the Zero Trust security model. Instead of trusting every user after login, the system continuously verifies requests based on user behavior and risk level before allowing access to APIs.<br>

The project monitors user activity, calculates a risk score, logs important events, and generates alerts for suspicious behavior.

---

## Features<br>

- JWT-based Authentication<br>
- Role-Based Access Control (RBAC)<br>
- User Behavior Monitoring<br>
- Risk Score Calculation<br>
- API Gateway<br>
- Suspicious Activity Alerts<br>
- Request Logging<br>
- Analytics Dashboard<br>

---

## Technologies Used<br>

- JavaScript (Node.js)<br>
- Express.js<br>
- MongoDB<br>
- Mongoose<br>
- JWT<br>
- REST APIs<br>

---

## How It Works<br>

1. A user sends a request to the API.<br>
2. The gateway verifies the JWT token.<br>
3. The user's role and permissions are checked.<br>
4. User behavior is analyzed to calculate a risk score.<br>
5. Suspicious requests are logged and alerts are generated.<br>
6. The request is either allowed or blocked based on the risk level.<br>

---

##By:<br>
Anshu Kasula
