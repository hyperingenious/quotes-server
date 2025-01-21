curl -X POST http://localhost:3000/cli/delete \
-H "Content-Type: application/json" \
-d '{
  "token": "a843e1be-28d5-4547-8ef0-44d45a489650",
  "deletionData": {
    "deletiontype": "delete_book",
    "bookId": "6759735000003c8fd05b"
  }
}'

token
a843e1be-28d5-4547-8ef0-44d45a489650
S

curl -X POST http://localhost:3000/cli/update-blogs \
-H "Content-Type: application/json" \
-d '{
  "token": "95f44631-a664-4828-8bd0-c0f01f184d2d",
  "updateData": {
    "blogid": "6765cba2a62639d1fb83",
    "updateObject": {
      "blog_markdown": "Bablesh Khalifa Rocks",
    },
  }
}'

curl -X POST http://localhost:3000/cli/generate-content?id=6783a4090004981188c0&user_id=user_2oFLUNePrbPyBH1zJL4gV4mn7Kp \
-H "Content-Type: multipart/form-data" \
-F "pdf=@/home/hyper/Downloads/_OceanofPDF.com_The_Hard_Thing_About_Hard_Things_-_Ben_Horowitz.pdf" \
-F "authorName=Ben Horowitz" \
-F "bookTitle=HARD THINGS ABOUT HARD THINGS" \
-F "imageUrl=https://example.com/image.jpg" \
-F "user_id=user_2oFLUNePrbPyBH1zJL4gV4mn7Kp"
-F "token=95f44631-a664-4828-8bd0-c0f01f184d2d"

curl -X POST http://localhost:3000/cli/get-content \
-H "Content-Type: application/json" \
-d '{
  "token": "95f44631-a664-4828-8bd0-c0f01f184d2d",
  "preference": {
    "preferenceType": "list_books"
  }
}'
