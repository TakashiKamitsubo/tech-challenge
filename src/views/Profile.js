import React from "react";
import { Container, Row, Col } from "reactstrap";

import contentData from "../utils/contentData"
import Highlight from "../components/Highlight"
import Loading from "../components/Loading"
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react"


export const ProfileComponent = () => {
  const getPizzaName = (pizza) => {
    return contentData.find(it => it.id === pizza).title
  }
  const { user } = useAuth0();
  const metadata = user["https://takashi-exercise.example.com/user_metadata"]
  const history = (metadata && metadata.history ? metadata.history : [])
  history.forEach(it => {
    const list = []
    if (Array.isArray(it.order)) {
      return
    }
    Object.keys(it.order).forEach(function(key) {
      list.push({ pizza: getPizzaName(key), count: this[key] })
    }, it.order)
    it.order = list
  })
  history.sort((obj1, obj2) => {
    return obj2.date - obj1.date
  })

  const rowStyle = {padding: "10px"}

  return (
    <Container className="mb-5">
      <Row className="align-items-center profile-header mb-5 text-center text-md-left">
        <Col md>
          <h2>Your order history</h2>
        </Col>
      </Row>
      {
        history.map(it => (
            <div key={it.date} style={rowStyle}>
              <Row>
                <h3>{new Date(it.date).toLocaleString()}</h3>
              </Row>
              <Row>
              {
                it.order.map(a => (
                  <React.Fragment key={a.pizza}>
                    <Col>
                      <h4>{a.pizza} x {a.count}</h4>
                    </Col>
                  </React.Fragment>
                ))
              }
              </Row>
            </div>
          ))
      }
      {/* <Row>
        <Highlight>{JSON.stringify(user, null, 2)}</Highlight>
      </Row> */}
    </Container>
  );
};

export default withAuthenticationRequired(ProfileComponent, {
  onRedirecting: () => <Loading />,
});
