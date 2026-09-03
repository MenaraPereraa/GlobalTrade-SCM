package lk.menara.globaltrade.rest.controller;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.io.File;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;

@Path("/uploads")
public class FileDownloadResource {

    private static final String UPLOAD_DIR = "C:/Users/Lenovo/Desktop/QuotationsFolder/";

    @GET
    @Path("/{filename:.*}")
    @Produces({"application/pdf", MediaType.APPLICATION_OCTET_STREAM, "*/*"})
    public Response downloadFile(
            @PathParam("filename") String filename,
            @HeaderParam(HttpHeaders.AUTHORIZATION) String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return Response.status(Response.Status.UNAUTHORIZED)
                        .entity("Authentication required")
                        .type(MediaType.TEXT_PLAIN)
                        .build();
            }

            String token = authHeader.substring("Bearer ".length()).trim();
            if (token.isEmpty()) {
                return Response.status(Response.Status.UNAUTHORIZED)
                        .entity("Invalid token")
                        .type(MediaType.TEXT_PLAIN)
                        .build();
            }

            String decodedFilename = URLDecoder.decode(filename, StandardCharsets.UTF_8.name());

            File rawFile = new File(decodedFilename);
            String pureFileName = rawFile.getName();

            File file = new File(UPLOAD_DIR + pureFileName);
            java.nio.file.Path filePath = file.toPath().toAbsolutePath().normalize();
            java.nio.file.Path uploadPath = Paths.get(UPLOAD_DIR).toAbsolutePath().normalize();

            if (!file.exists()) {
                File alternativeFile = new File(UPLOAD_DIR + decodedFilename);
                if (alternativeFile.exists()) {
                    file = alternativeFile;
                    filePath = alternativeFile.toPath().toAbsolutePath().normalize();
                } else {
                    File dir = new File(UPLOAD_DIR);
                    File[] matchingFiles = dir.listFiles((dir1, name) -> name.endsWith(pureFileName));
                    if (matchingFiles != null && matchingFiles.length > 0) {
                        file = matchingFiles[0];
                        filePath = file.toPath().toAbsolutePath().normalize();
                    }
                }
            }

            if (!file.exists()) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity("PDF file not found: " + pureFileName)
                        .type(MediaType.TEXT_PLAIN)
                        .build();
            }

            String contentType = Files.probeContentType(filePath);
            if (contentType == null || contentType.isEmpty()) {
                contentType = "application/pdf";
            }

            return Response.ok(file, contentType)
                    .header("Content-Disposition", "inline; filename=\"" + file.getName() + "\"")
                    .header("Cache-Control", "no-cache, no-store, must-revalidate")
                    .build();

        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("Error loading PDF: " + e.getMessage())
                    .type(MediaType.TEXT_PLAIN)
                    .build();
        }
    }
}