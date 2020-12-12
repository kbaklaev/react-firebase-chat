import { useEffect, useRef, useState } from "react";

import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";

import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";

import "./App.css";

firebase.initializeApp({
// place for your firebase credentials !!!! ONLY !!!!! for test
});

firebase.auth().useDeviceLanguage();

const auth = firebase.auth();
const firestore = firebase.firestore();

const App = () => {
  const [user] = useAuthState(auth);

  return (
    <div className="App">
      <header>
        <h1>react firebase chat</h1>
        <SignOut />
      </header>
      <section>{user ? <ChatRoom /> : <SignIn />}</section>
    </div>
  );
};

const SignIn = () => {
  const [phone, setPhone] = useState("");

  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  };

  const signInWithPhone = () => {
    const captcha = new firebase.auth.RecaptchaVerifier("recaptcha-container", {
      'size': 'invisible'
    });
    firebase
      .auth()
      .signInWithPhoneNumber(phone, captcha)
      .then((e) => {
        const code = prompt("Enter the one time password", "");
        if (code === null) return;

        e.confirm(code)
          .then((result) => {
            console.log(result.user);

            document.querySelector("label").textContent +=
              result.user.phoneNumber + "Number verified";
          })
          .catch((error) => {
            console.error(error);
          });
      })
      .catch((error) => {
        console.error(error);
      });
  };

  return (
    <>
      <button type="button" onClick={signInWithGoogle}>
        Sign in with Google
      </button>
      <br />
      <div className="container">
        <div id="recaptcha-container" />
      </div>
      <input
        placeholder="Enter your phonenumber"
        type="phone"
        value={phone}
        onChange={(e) => {
          setPhone(e.target.value);
        }}
      />
      <button id="phone" type="button" onClick={signInWithPhone}>
        Sign in with Phone
      </button>
      <label></label>
    </>
  );
};

const SignOut = () => {
  return (
    auth.currentUser && (
      <button type="button" onClick={() => auth.signOut()}>
        Sign Out
      </button>
    )
  );
};

const ChatRoom = () => {
  const [formValue, setFormValue] = useState("");
  const dummy = useRef();
  const messagesRef = firestore.collection("messages");
  const query = messagesRef.orderBy("createdAt").limitToLast(25);

  const [messages] = useCollectionData(query, { idField: "id" });

  const sendMessage = async (e) => {
    e.preventDefault();

    const { uid, photoURL } = auth.currentUser;

    await messagesRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL,
    });

    setFormValue("");
  };

  useEffect(() => {
    dummy.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div>
      {messages &&
        messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
      <span ref={dummy} />
      <form onSubmit={sendMessage}>
        <input
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
          placeholder="Enter your massage"
        />
        <button type="submit" disabled={!formValue}>
          Submit
        </button>
      </form>
    </div>
  );
};

const ChatMessage = ({ message }) => {
  const { text, uid, photoURL } = message;

  const messageClass = uid === auth.currentUser.uid ? "sent" : "recieved";

  return (
    <div className={`message ${messageClass}`}>
      <img src={photoURL} alt="userPhoto" />
      <p>{text}</p>
    </div>
  );
};

export default App;
