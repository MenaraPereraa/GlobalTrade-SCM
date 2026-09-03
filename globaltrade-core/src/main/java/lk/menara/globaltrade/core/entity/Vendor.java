package lk.menara.globaltrade.core.entity;

import jakarta.json.bind.annotation.JsonbTransient;
import jakarta.persistence.*;
import lk.menara.globaltrade.core.enums.VendorStatus;

import java.io.Serializable;
import java.util.List;

@Entity
@Table(name = "vendor")
public class Vendor implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer vendorId;

    @OneToOne
    @JoinColumn(name = "user_id")
    @JsonbTransient
    private User user;

    @Column(nullable = false, length = 100)
    private String vendorName;

    @Column(nullable = false, length = 100)
    private String contactEmail;

    @Column(length = 50)
    private String category;

    @Column(nullable = false, length = 3)
    private String countryCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VendorStatus status;

    @OneToMany(mappedBy = "vendor", fetch = FetchType.LAZY)
    @JsonbTransient
    private List<VendorEvaluation> evaluations;

    @OneToMany(mappedBy = "vendor", fetch = FetchType.LAZY)
    @JsonbTransient
    private List<ReplenishmentRequest> replenishmentRequests;

    public Vendor() {
    }

    public Vendor(User user, String vendorName, String contactEmail, String category, String countryCode, VendorStatus status) {
        this.user = user;
        this.vendorName = vendorName;
        this.contactEmail = contactEmail;
        this.category = category;
        this.countryCode = countryCode;
        this.status = status;
    }

    public Integer getVendorId() {
        return vendorId;
    }

    public void setVendorId(Integer vendorId) {
        this.vendorId = vendorId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getVendorName() {
        return vendorName;
    }

    public void setVendorName(String vendorName) {
        this.vendorName = vendorName;
    }

    public String getName() {
        return vendorName;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getEmail() {
        return contactEmail;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }

    public VendorStatus getStatus() {
        return status;
    }

    public void setStatus(VendorStatus status) {
        this.status = status;
    }

    public List<VendorEvaluation> getEvaluations() {
        return evaluations;
    }

    public void setEvaluations(List<VendorEvaluation> evaluations) {
        this.evaluations = evaluations;
    }

    public List<ReplenishmentRequest> getReplenishmentRequests() {
        return replenishmentRequests;
    }

    public void setReplenishmentRequests(List<ReplenishmentRequest> replenishmentRequests) {
        this.replenishmentRequests = replenishmentRequests;
    }
}