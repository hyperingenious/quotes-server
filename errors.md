GET_CHECK_IF_AT_LEAST_ONE_BOOK_IS_THERE
GET_FETCH_BLOGS
GET_FETCH_BOOK
GET_BLOG_BY_ID
GET_GET_ALL_BLOGS_WITH_BOOK_ID
GET_GET_PUBLICLY_SHARED_BLOG_WITH_ID
GET_GET_TOKEN_DATA

POST_SHARE_BLOG_PUBLICLY
POST_CREATE_TOKEN_ENTRY
POST_DELETE_TOKEN
POST_MARK_BLOG_READ

async function markBlogRead({ id }) {
  await databases.updateDocument(databaseID, process.env.NEXT_PUBLIC_BLOGS_COLLECTION_ID, id, {
    isRead: true,
  });
  return null;
}
// Backchodi

# HTTP Status Code Cheat Sheet
## 2xx Success
- **200 OK**: Request succeeded, response body contains data.
- **201 Created**: Resource successfully created (e.g., after POST).
- **202 Accepted**: Request accepted, processing is not complete yet.
- **204 No Content**: Request succeeded, no content in the response.
- **206 Partial Content**: Partial resource delivered (e.g., range requests).

## 4xx Client Errors
- **400 Bad Request**: Invalid request syntax or data.
- **401 Unauthorized**: Authentication required or failed.
- **403 Forbidden**: Access to the resource is denied.
- **404 Not Found**: Requested resource does not exist.
- **405 Method Not Allowed**: HTTP method not supported for the resource.
- **422 Unprocessable Entity**: Valid request but semantic errors.

## 5xx Server Errors
- **500 Internal Server Error**: Generic error on the server side.
- **502 Bad Gateway**: Invalid response from an upstream server.
- **503 Service Unavailable**: Server is overloaded or under maintenance.
- **504 Gateway Timeout**: Upstream server did not respond in time.
