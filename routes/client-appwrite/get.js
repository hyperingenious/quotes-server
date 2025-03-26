require("dotenv").config();
const sdk = require("node-appwrite");

const {
  databases,
  DATABASE_ID,
  BOOKS_COLLECTION_ID,
  BLOGS_COLLECTION_ID,
  PUBLICLY_SHARED_BLOGS_COLLECTION_ID,
  TOKENISATION_COLLECTION_ID,
  CATEGORY_COLLECTION_ID,
} = require("../../appwrite/appwrite");
const { invalidateToken } = require("../../helpers/helper");

async function clientAppwriteGET(req, res) {
  try {
    console.log(req.query.slug);
    /**
     * Verifies the user's token using the invalidateToken helper function to ensure authentication.
     */
    const verifiedToken = await invalidateToken({ req, res });

    const slug = req.query.slug;

    if (!slug) {
      res
        .status(400)
        .json({ error: "Bad Request", message: "Slug not found!" });
    }
    switch (slug) {
      case "GET_CATEGORIES": {
        const { documents } = await databases.listDocuments(
          DATABASE_ID,
          CATEGORY_COLLECTION_ID,
          [sdk.Query.limit(1000), sdk.Query.equal("user_id", verifiedToken.sub)]
        );
        res.status(200).json(documents);
        break;
      }

      case "GET_CHECK_IF_AT_LEAST_ONE_BOOK_IS_THERE": {
        const { documents } = await databases.listDocuments(
          DATABASE_ID,
          BOOKS_COLLECTION_ID,
          [sdk.Query.equal("user_id", [verifiedToken.sub])]
        );
        res.status(200).json({ count: documents.length });
        break;
      }

      case "GET_FETCH_BLOGS": {
        const offset = req.query.offset;
        const { documents } = await databases.listDocuments(
          DATABASE_ID,
          BLOGS_COLLECTION_ID,
          [
            sdk.Query.limit(7),
            sdk.Query.offset(offset * 7),
            sdk.Query.orderDesc(),
            sdk.Query.equal("user_id", [verifiedToken.sub, 'user_2ur1m5I0EdV5hjQOY5CS1QIbMuF']),
            sdk.Query.isNull("isRead"),
          ]
        );
        res.status(200).json(documents);
        break;
      }

      case "GET_FETCH_BOOK": {
        const { documents } = await databases.listDocuments(
          DATABASE_ID,
          BOOKS_COLLECTION_ID,
          [
            sdk.Query.equal("user_id", [
              verifiedToken.sub,
              "user_2ur1m5I0EdV5hjQOY5CS1QIbMuF",
            ]),
            sdk.Query.limit(1000000),
          ]
        );

        for (let i = 0; i < documents.length; i++) {
          const current_document = documents[i];
          const { documents: blogs } = await databases.listDocuments(
            DATABASE_ID,
            BLOGS_COLLECTION_ID,
            [
              sdk.Query.equal("books", current_document.$id),
              sdk.Query.select(["$id"]),
            ]
          );
          documents[i] = { ...current_document, blogs };
        }
        res.status(200).json(documents.reverse());
        break;
      }

      case "GET_BLOG_BY_ID": {
        const id = req.query.id;
        const doc = await databases.getDocument(
          DATABASE_ID,
          BLOGS_COLLECTION_ID,
          id
        );
        if (
          doc.user_id !== "user_2ur1m5I0EdV5hjQOY5CS1QIbMuF" &&
          doc.user_id !== verifiedToken.sub
        ) {
          throw Error("The Blog Does not belong to you");
        }

        res.status(200).json({
          blog: doc,
          isANoContentBlog: doc.user_id === "user_2ur1m5I0EdV5hjQOY5CS1QIbMuF",
        });
        break;
      }

      case "GET_GET_ALL_BLOGS_WITH_BOOK_ID": {
        const { book_id, blog_exception, isANoContentBlog } = req.query;
        const filters = isANoContentBlog
          ? [
            sdk.Query.equal("books", [book_id]),
            sdk.Query.notEqual("$id", [blog_exception]),
          ]
          : [
            sdk.Query.equal("user_id", [verifiedToken.sub]),
            sdk.Query.equal("books", [book_id]),
            sdk.Query.notEqual("$id", [blog_exception]),
            sdk.Query.isNull("isRead"),
          ];
        const blogs = await databases.listDocuments(
          DATABASE_ID,
          BLOGS_COLLECTION_ID,
          filters
        );
        res.status(200).json(blogs);
        break;
      }

      case "GET_GET_TOKEN_DATA": {
        const { documents } = await databases.listDocuments(
          DATABASE_ID,
          TOKENISATION_COLLECTION_ID,
          [sdk.Query.equal("user_id", [verifiedToken.sub])]
        );

        const mappedDocuments = documents.map((doc) => {
          const parsedJSON = JSON.parse(doc.access);
          return Object.entries(parsedJSON).flatMap(([category, permissions]) =>
            Object.entries(permissions).map(([access_type, permissionKey]) => ({
              category,
              access_type,
              value: permissionKey,
            }))
          );
        });
        res.status(200).json(mappedDocuments);
        break;
      }

      default:
        res.status(404).json({ error: "Route not found" });
    }
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
/*
curl -X GET \
  'http://localhost:3000/public-client-appwrite-get?slug=GET_GET_PUBLICLY_SHARED_BLOG_WITH_ID&id=6756d4000039949c064d'
*/
async function publicClientAppwriteGET(req, res) {
  try {
    console.log(req.query.slug);
    const slug = req.query.slug;
    if (!slug) {
      res
        .status(400)
        .json({ error: "Bad Request", message: "Slug not found!" });
    }

    switch (slug) {
      case "GET_GET_PUBLICLY_SHARED_BLOG_WITH_ID": {
        const id = req.query.id;
        const blog = await databases.getDocument(
          DATABASE_ID,
          PUBLICLY_SHARED_BLOGS_COLLECTION_ID,
          id
        );
        res.status(200).json(blog);
        break;
      }
      default:
        res.status(404).json({ error: "Route not found" });
    }
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}
module.exports = { clientAppwriteGET, publicClientAppwriteGET };
