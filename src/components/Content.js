import React, { Component } from "react";

import { Row, Col } from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getConfig } from "../config";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";

import contentData from "../utils/contentData";

const order = {}

function OrderBox({pizza}) {
  const [count, setCount] = React.useState(0)

  const onMinusClick = () => {
    if (count === 0) {
      return
    }
    order[pizza] = count - 1
    setCount(order[pizza])

    if (order[pizza] === 0) {
      delete order[pizza]
    }
  }
  const onPlusClick = () => {
    order[pizza] = count + 1
    setCount(order[pizza])
  }

  return (
    <span className="order-box">
      <button className="minus" onClick={onMinusClick}>-</button>
      <input type="text" value={count} disabled size="2" />
      <button className="plus" onClick={onPlusClick}>+</button>
    </span>
  )
}

function Content () {
  const {user, getAccessTokenSilently} = useAuth0()

  async function makeOrder() {
    if (Object.keys(order).length === 0) {
      alert("Please select your pizza")
      return
    }
    if (!user) {
      alert("Please login before the order")
      return
    }
  
    if (!user.email_verified) {
      alert("Please verify your email before the order.")
      return
    }

    try {
      const { apiOrigin = "http://localhost:3001", audience } = getConfig();

      const token = await getAccessTokenSilently();

      const res = await fetch(`${apiOrigin}/api/pizza/order`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(order)
      });

      if (!res.ok) {
        return
      }

      const json = await res.json();
      if (json.status !== "OK") {
        alert(json.message)
        return
      }
      alert("Thank you for the order!")
      window.location.reload()
    } catch (error) {
    }
  }
    
    return (
      <div className="next-steps my-5">
        <h2 className="my-5 text-center">Let's order your pizza!!</h2>
        <Row className="d-flex justify-content-between">
          {contentData.map((col, i) => (
            <Col key={col.id} md={5} className="mb-4">
              <h6 className="mb-3">
                  {col.title}
              </h6>
              <img src={col.image} width="200" height="200" />
              <p>$ {col.price}
                <OrderBox pizza={col.id} />
              </p>
            </Col>
          ))}
        </Row>
        <button onClick={makeOrder}>
          Order
        </button>
      </div>
    );
  // }
}

export default Content;
